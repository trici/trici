import { AppObserverService } from '@trici/app-observer';
import type { Logger } from '@trici/logger';
import { Constants, DailyUserActivity, TriciAppEvent, UsedAppCategory } from '@trici/models';
import { generateNewTriciId, generateUpdatedTriciId, isTriciIdValidForToday, isWebBrowser } from '@trici/utils';
import { IAppJsonStorageService } from './AppJsonStorageService';
import { AppEventEmitter } from './AppEventEmitter';
import { ITriciDesktopService } from '../typedefs/ITriciDesktopService';
import { IActionDispatcher } from './ActionDispatcher';
import { TriciAction } from '../typedefs/TriciAction';
import UsedApplicationsService from './UsedApplicationsService';
import { UserActivityStateMachine } from '@trici/activmon';
import { UserActivityState } from '@trici/models';
import { isUserWorking } from '@trici/utils';
export interface IUserActivityMonitorService {
  start(): Promise<void>;
  stop(): Promise<void>;
  getUserActivityState(): UserActivityState;
}

export class UserActivityMonitorService implements ITriciDesktopService, IUserActivityMonitorService {
  appObserverServiceInstance: AppObserverService;
  logger: Logger;
  userActivityStateMachine: UserActivityStateMachine;
  lastIdleTime: number;
  todaysUserActitivity: DailyUserActivity | null;
  appJsonStorageService: IAppJsonStorageService;
  appEventEmitter: AppEventEmitter;
  isServiceInitialized: boolean = false;
  actionDispatcher: IActionDispatcher<TriciAction>;
  usedApplicationsService: UsedApplicationsService;

  constructor(
    logger: Logger,
    appObserverServiceInstance: AppObserverService,
    appJsonStorageService: IAppJsonStorageService,
    appEventEmitter: AppEventEmitter,
    actionDispatcher: IActionDispatcher<TriciAction>,
    usedApplicationsService: UsedApplicationsService,
    userActivityStateMachine: UserActivityStateMachine,
  ) {
    this.logger = logger;
    this.appObserverServiceInstance = appObserverServiceInstance;
    this.userActivityStateMachine = userActivityStateMachine;
    this.lastIdleTime = -1;
    this.todaysUserActitivity = null;
    this.appJsonStorageService = appJsonStorageService;
    this.appEventEmitter = appEventEmitter;
    this.isServiceInitialized = false;
    this.actionDispatcher = actionDispatcher;
    this.usedApplicationsService = usedApplicationsService;
  }

  updateLastSavedTodayUserActivityId = async (udpatedId: string) => {
    await this.appJsonStorageService.updateLastSavedEntityIds('todayUserActivityId', udpatedId);
  };

  handleTriciPing = (idleTime: number) => {
    const idleTimeDiff = this.lastIdleTime - idleTime;
    this.userActivityStateMachine.handleEvent({
      idleTime,
      idleTimeDiff,
    });

    this.lastIdleTime = idleTime;
  };

  registerActionHandlers(): void {
    // TODO: Register any action handlers that this service needs to handle
    this.actionDispatcher.register((action: TriciAction) => {
      switch (action.type) {
        case 'CLEANUP_BEFORE_SHUTDOWN':
          this.stop();
          break;
        case 'PING_FUNCTION':
          console.log('PING_FUNCTION called');
          this.appObserverServiceInstance.getActiveBrowserOpenedURL().then(url => {
            console.log('Active browser URL:', url);
            if (url) {
              const isWorking = isUserWorking(url);
              console.log('isWorking:', isWorking);
            }
          });
          break;
        default:
          break;
      }
    });
  }

  registerAppEventHandlers(): void {
    // TODO: Register any app event handlers that this service needs to handle

    this.appEventEmitter.on(
      TriciAppEvent.USER_HYPER_ACTIVE,
      async (idleTimeNearHistoryAverage: number, idleTimeImmediateHistoryAverage: number) => {
        console.log('UserHyperActive');
        const currentAppDetails = await this.getCurrentAppDetails();
        await this.handleTriciAppEvent(
          currentAppDetails.currentApplication,
          currentAppDetails.currentAppCategory,
          TriciAppEvent.USER_HYPER_ACTIVE,
          {
            idleTimeNearHistoryAverage,
            idleTimeImmediateHistoryAverage,
          },
        );
      },
    );

    this.appEventEmitter.on(
      TriciAppEvent.USER_BECOMING_HYPER_ACTIVE,
      async (idleTimeNearHistoryAverage: number, idleTimeImmediateHistoryAverage: number) => {
        // If the user is using a browser when hyperactive, then we want to know the url that
        // the user is browsing to figure out whether the user is working or leisure.
        // Thus I was thinking that we should enquire what is the url only when the user is hyperactive.
        // So we don't get to know the url when the user changes the tab in the browser. This is a problem.
        // Upon further investigation, to know the url when the user changes the tab in the browser etc., we
        // will need to build a browser extension.

        const appEventData = {
          idleTimeNearHistoryAverage,
          idleTimeImmediateHistoryAverage,
        };
        console.log('UserBecomingHyperActive');
        const currentAppDetails = await this.getCurrentAppDetails();
        await this.handleTriciAppEvent(
          currentAppDetails.currentApplication,
          currentAppDetails.currentAppCategory,
          TriciAppEvent.USER_BECOMING_HYPER_ACTIVE,
          appEventData,
        );
      },
    );
  }

  getCurrentAppDetails = async () => {
    const currentApplication = this.appObserverServiceInstance.getCurrentApp();
    const currentApplicationIdentifier = currentApplication?.appIdentifier || 'unknown';
    const currentAppCategory = this.usedApplicationsService.getAppCategory(currentApplicationIdentifier);
    return { currentApplication, currentAppCategory };
  };

  handleTriciAppEvent = async (
    currentApplication: { appName: string; appIdentifier: string; timestamp: number } | null,
    currentAppCategory: UsedAppCategory,
    appEvent: TriciAppEvent,
    appEventData: {
      idleTimeNearHistoryAverage: number;
      idleTimeImmediateHistoryAverage: number;
    },
  ) => {
    if (!currentApplication) {
      console.log('No current application');
      return;
    }
    const currentTimestamp = Date.now();
    const durationOfCurrentApp = currentApplication?.timestamp
      ? currentTimestamp - currentApplication.timestamp * 1000
      : 0;
    console.log('durationOfCurrentApp:', durationOfCurrentApp);

    switch (currentAppCategory) {
      case UsedAppCategory.DEFINITELY_WORK:
        this.handleActivityWhenUsingWorkApp(currentApplication, durationOfCurrentApp, appEvent, appEventData);
        break;
      case UsedAppCategory.DEFINITELY_DISTRACT:
        console.log('User fooling around');
        break;
      case UsedAppCategory.COULD_BE_ANYTHING:
        // Right now, only browsers are categorized as COULD_BE_ANYTHING. If/When we allow the user to categorize apps, then it could be other apps as well.
        // This does beg the question that shoyuld I allow the user to categorize apps?
        if (isWebBrowser(currentApplication?.appName || 'unknown')) {
          this.handleActivityWhenUsingBrowser(currentApplication, durationOfCurrentApp, appEvent, appEventData);
        } else {
          console.log('Not sure what to do');
        }
        break;
      case UsedAppCategory.NOT_SET:
        console.log('Not sure what to do');
        break;
      default:
        console.log('Unknown app category');
        break;
    }
  };

  handleActivityWhenUsingWorkApp = (
    currentApplication: { appName: string; appIdentifier: string; timestamp: number },
    durationOfCurrentApp: number,
    appEvent: TriciAppEvent,
    appEventData: {
      idleTimeNearHistoryAverage: number;
      idleTimeImmediateHistoryAverage: number;
    },
  ) => {
    if (appEvent === TriciAppEvent.USER_BECOMING_HYPER_ACTIVE) {
      if (durationOfCurrentApp > 30 * 1000) {
        console.log('User might have started working');
        this.appEventEmitter.emit(TriciAppEvent.USER_STARTED_WORKING, {
          appName: currentApplication.appName,
          durationOfCurrentApp,
          appEventData,
        });
      } else {
        console.log('User might have started working but not for long');
      }
    } else if (appEvent === TriciAppEvent.USER_HYPER_ACTIVE) {
      console.log('User is hyperactive and working');
      if (durationOfCurrentApp > 10 * 1000) {
        console.log('User is working');
        this.appEventEmitter.emit(TriciAppEvent.USER_STARTED_WORKING, {
          appName: currentApplication.appName,
          durationOfCurrentApp,
          appEventData,
        });
      } else {
        console.log('User is working but not for long');
      }
    }
  };

  handleActivityWhenUsingBrowser = async (
    currentApplication: { appName: string; appIdentifier: string; timestamp: number },
    durationOfCurrentApp: number,
    appEvent: TriciAppEvent,
    appEventData: {
      idleTimeNearHistoryAverage: number;
      idleTimeImmediateHistoryAverage: number;
    },
  ) => {
    try {
      const urlBeingBrowsed = await this.appObserverServiceInstance.getActiveBrowserOpenedURL();
      console.log('User is using a browser');
      console.log('urlBeingBrowsed:', urlBeingBrowsed);
      if (urlBeingBrowsed) {
        const isWorking = isUserWorking(urlBeingBrowsed);
        console.log('isWorking:', isWorking);
      }
    } catch (error) {
      console.error('Error getting active browser opened URL:', error);
    }
  };

  handleUserActivityStateChange = (
    state: UserActivityState,
    idleTimeNearHistoryAverage: number,
    idleTimeImmediateHistoryAverage: number,
  ) => {
    switch (state) {
      case UserActivityState.ACTIVE:
        this.appEventEmitter.emit(TriciAppEvent.USER_ACTIVE, {
          idleTimeNearHistoryAverage,
          idleTimeImmediateHistoryAverage,
        });
        break;
      case UserActivityState.GOING_INACTIVE:
        this.appEventEmitter.emit(TriciAppEvent.USER_GOING_INACTIVE, {
          idleTimeNearHistoryAverage,
          idleTimeImmediateHistoryAverage,
        });
        break;
      case UserActivityState.INACTIVE:
        this.appEventEmitter.emit(TriciAppEvent.USER_INACTIVE, {
          idleTimeNearHistoryAverage,
          idleTimeImmediateHistoryAverage,
        });
        break;
      case UserActivityState.AWAY:
        this.appEventEmitter.emit(TriciAppEvent.USER_WENT_AWAY, {
          idleTimeNearHistoryAverage,
          idleTimeImmediateHistoryAverage,
        });
        break;
      case UserActivityState.BECOMING_HYPER_ACTIVE:
        this.appEventEmitter.emit(TriciAppEvent.USER_BECOMING_HYPER_ACTIVE, {
          idleTimeNearHistoryAverage,
          idleTimeImmediateHistoryAverage,
        });
        break;
      case UserActivityState.HYPER_ACTIVE:
        this.appEventEmitter.emit(TriciAppEvent.USER_HYPER_ACTIVE, {
          idleTimeNearHistoryAverage,
          idleTimeImmediateHistoryAverage,
        });
        break;
      case UserActivityState.IDLE:
        this.appEventEmitter.emit(TriciAppEvent.USER_IDLE, {
          idleTimeNearHistoryAverage,
          idleTimeImmediateHistoryAverage,
        });
        break;
      default:
        console.log('Unknown state');
        break;
    }
  };

  public initService(): void {
    if (!this.isServiceInitialized) {
      // Subsribe to state change events from the UserActivityStateMachine
      this.userActivityStateMachine.on('stateChanged', this.handleUserActivityStateChange);
      this.registerActionHandlers();
      this.registerAppEventHandlers();
      this.isServiceInitialized = true;
    }
  }

  async start(): Promise<void> {
    //Register event handlers to handle events from the services.
    this.appObserverServiceInstance.on('idleTime', idleTime => this.handleTriciPing(idleTime));

    this.appObserverServiceInstance.on('frontmostAppChanged', (frontmostAppChangeData: any) => {
      this.logger.info(`UserActivityMonitorService frontmostAppChanged:${JSON.stringify(frontmostAppChangeData)}`);
      this.appEventEmitter.emit(TriciAppEvent.FRONTMOST_APP_CHANGED, frontmostAppChangeData);
    });

    // IMPORTANT: Earlier I was saving the events in DailyUserActivity, now they are saved in sqlite app_event table.

    // try {
    //   // Fetch the current user activity from the db.
    //   // If there is no user activity for today, create one.
    //   let lastSavedEntityIds = await this.appJsonStorageService.getLastSavedEntityIds();
    //   let todayUserActivityId = lastSavedEntityIds.get('todayUserActivityId');
    //   if (
    //     todayUserActivityId === undefined ||
    //     todayUserActivityId === Constants.UNINITIALIZED_ID ||
    //     !isTriciIdValidForToday(todayUserActivityId)
    //   ) {
    //     todayUserActivityId = generateNewTriciId(installationId, KEY_PARTS.DAILY_USER_ACTIVITY);
    //   }

    //   let result = await this.repository.get(todayUserActivityId);
    //   if (result === null) {
    //     this.todaysUserActitivity = new DailyUserActivity();
    //     this.todaysUserActitivity = this.todaysUserActitivity.set('_id', todayUserActivityId);
    //     this.repository.save(this.todaysUserActitivity.toJS(), Constants.UNINITIALIZED_ID);
    //     this.updateLastSavedTodayUserActivityId(todayUserActivityId);
    //   }
    //   this.todaysUserActitivity = new DailyUserActivity(result);
    // } catch (err) {
    //   this.logger.error(`UserActivityMonitorService: Error while fetching today's user activity: ${err}`);
    // }
    this.appObserverServiceInstance.start(isRunningInAsar);
  }

  async stop(): Promise<void> {
    this.appObserverServiceInstance.stop();
    this.appObserverServiceInstance.removeAllListeners();
  }

  getUserActivityState(): UserActivityState {
    return this.userActivityStateMachine.getCurrentState();
  }
}
