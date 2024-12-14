import { IdleTimeServiceInstance } from './IdleTimeService';
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
  idleTimeServiceInstance: IdleTimeServiceInstance;
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
    idleTimeServiceInstance: IdleTimeServiceInstance,
    appObserverServiceInstance: AppObserverService,
    appJsonStorageService: IAppJsonStorageService,
    appEventEmitter: AppEventEmitter,
    actionDispatcher: IActionDispatcher<TriciAction>,
    usedApplicationsService: UsedApplicationsService,
    userActivityStateMachine: UserActivityStateMachine,
  ) {
    this.logger = logger;
    this.idleTimeServiceInstance = idleTimeServiceInstance;
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


    // console.log(
    //   'idleTime, lastIdleTime, idleTimeDiff, userActivityState',
    //   idleTime,
    //   this.lastIdleTime,
    //   idleTimeDiff,
    //   this.userActivityStateMachine.getCurrentState(),
    // );

    // if (idleTimeDiff > Constants.USER_WENT_AWAY_THRESHOLD) {
    //   console.log('user-came-back');
    //   this.appEventEmitter.emit(TriciAppEvent.USER_CAME_BACK);
    //   // mainWindow.webContents.send('receiveMessageRenderer', { handler: 'userCameBack', data: {} });
    //   this.userCameBackAt = Date.now();
    //   this.userBecameActiveAt = this.userCameBackAt;
    //   this.userBecameSuperActiveAt = this.userCameBackAt;
    //   this.userWentAwayAt = 0;
    //   this.userBecameInactiveAt = 0;
    //   // NotificationService.showUserCameBackNotification();
    // } else if (idleTimeDiff > Constants.INACTIVE_ACTIVE_THRESHOLD) {
    //   console.log('user-active');
    //   this.appEventEmitter.emit(TriciAppEvent.USER_ACTIVE);
    //   // mainWindow.webContents.send('receiveMessageRenderer', { handler: 'userActive', data: {} });
    //   this.userBecameActiveAt = Date.now();
    //   this.userBecameSuperActiveAt = this.userBecameActiveAt;
    //   this.userBecameInactiveAt = 0;
    // }
    // if (idleTime > Constants.USER_WENT_AWAY_THRESHOLD) {
    //   if (this.userWentAwayAt === 0) {
    //     this.userWentAwayAt = Date.now();
    //     // mainWindow.webContents.send('receiveMessageRenderer', { handler: 'userWentAway', data: {} });
    //     console.log('user-went-away');
    //     this.appEventEmitter.emit(TriciAppEvent.USER_WENT_AWAY);
    //   }
    // } else if (idleTime > Constants.INACTIVE_ACTIVE_THRESHOLD) {
    //   if (this.userBecameInactiveAt === 0) {
    //     // NotificationService.showSessionEndedNotification();
    //     console.log('user-inactive');
    //     this.appEventEmitter.emit(TriciAppEvent.USER_INACTIVE);
    //     // mainWindow.webContents.send('receiveMessageRenderer', { handler: 'userInactive', data: {} });
    //     this.userBecameInactiveAt = Date.now();
    //   }
    // } else if (idleTime > Constants.GOING_INACTIVE_THRESHOLD && idleTime <= Constants.GOING_INACTIVE_THRESHOLD + 2) {
    //   console.log('user-going-inactive');
    //   this.appEventEmitter.emit(TriciAppEvent.USER_GOING_INACTIVE);
    //   // mainWindow.webContents.send('receiveMessageRenderer', { handler: 'userGoingInactive', data: {} });
    //   // NotificationService.showGoingInactiveNotification();
    // } else if (idleTime < Constants.HYPER_ACTIVE_THRESHOLD) {
    //   if (this.userBecameHyperActiveAt === 0) {
    //     this.userBecameHyperActiveAt = Date.now();
    //   } else {
    //     this.userHyperActiveForInSeconds = (Date.now() - this.userBecameHyperActiveAt) / 1000;
    //     if (
    //       this.userHyperActiveForInSeconds > Constants.HYPER_ACTIVE_ZONE_BEGIN_TIME_IN_SECONDS &&
    //       this.userHyperActiveForInSeconds <= Constants.HYPER_ACTIVE_ZONE_BEGIN_TIME_IN_SECONDS + 2
    //     ) {
    //       console.log('user-becoming-hyper-active');
    //       console.log(TriciAppEvent.USER_BECOMING_HYPER_ACTIVE);
    //       this.appEventEmitter.emit(TriciAppEvent.USER_BECOMING_HYPER_ACTIVE, {});
    //       // NotificationService.useTrayToPromptToStart();
    //     } else if (
    //       this.userHyperActiveForInSeconds > Constants.HYPER_ACTIVE_ZONE_TIME_IN_SECONDS &&
    //       this.userHyperActiveForInSeconds <= Constants.HYPER_ACTIVE_ZONE_TIME_IN_SECONDS + 2
    //     ) {
    //       console.log('user-hyper-active');
    //       this.appEventEmitter.emit(TriciAppEvent.USER_HYPER_ACTIVE);
    //       // mainWindow.webContents.send('receiveMessageRenderer', { handler: 'userHyperActive', data: {} });
    //       // NotificationService.useTrayToPromptToStart();
    //       // NotificationService.showPromptToStartFocusSession();
    //       // set userBecameHyperActiveAt to zero after 5 minutes
    //       const self = this;
    //       setTimeout(() => {
    //         self.userBecameHyperActiveAt = 0;
    //       }, 300000);
    //     }
    //   }
    // } else if (this.userBecameHyperActiveAt !== 0) {
    //   this.userBecameHyperActiveAt = 0;
    //   this.userHyperActiveForInSeconds = (Date.now() - this.userBecameHyperActiveAt) / 1000;
    //   if (this.userHyperActiveForInSeconds > Constants.HYPER_ACTIVE_ZONE_TIME_IN_SECONDS) {
    //     //mainWindow.webContents.send('receiveMessageRenderer', { handler: 'userHyperActiveEnd', data: {} });
    //   }
    // }
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
              const isWorking = isUserWorking(url)
              console.log('isWorking:', isWorking)
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
    this.appEventEmitter.on(TriciAppEvent.USER_BECOMING_HYPER_ACTIVE, async () => {
      // If the user is using a browser when hyperactive, then we want to know the url that
      // the user is browsing to figure out whether the user is working or leisure.
      // Thus I was thinking that we should enquire what is the url only when the user is hyperactive.
      // So we don't get to know the url when the user changes the tab in the browser. This is a problem.
      // Upon further investigation, to know the url when the user changes the tab in the browser etc., we
      // will need to build a browser extension.

      const currentApplication = this.appObserverServiceInstance.getCurrentApp();
      console.log('UserHyperActive.currentApplication:', currentApplication);
      const currentApplicationIdentifier = currentApplication?.appIdentifier || 'unknown';
      const currentAppCategory = this.usedApplicationsService.getAppCategory(currentApplicationIdentifier);
      console.log('UserHyperActive.currentAppCategory:', currentAppCategory);
      if (currentAppCategory === UsedAppCategory.DEFINITELY_WORK) {
        console.log('User started working');
        this.appEventEmitter.emit(TriciAppEvent.USER_STARTED_WORKING, currentApplication);
      } else if (currentAppCategory === UsedAppCategory.DEFINITELY_DISTRACT) {
        console.log('User Fooling around');
      } else if (currentAppCategory === UsedAppCategory.COULD_BE_ANYTHING) {
        // Right now, only browsers are categorized as COULD_BE_ANYTHING. If/When we allow the user to categorize apps, then it could be other apps as well.
        // This does beg the question that shoyuld I allow the user to categorize apps?
        // check if the current app is a browser
        if (isWebBrowser(currentApplication?.appName || 'unknown')) {
          console.log('User is browsing');
          const currentUrl = await this.appObserverServiceInstance.getActiveBrowserOpenedURL();
          console.log('currentUrl:', currentUrl);
          if (currentUrl) {
            const userIsWorking = isUserWorking(currentUrl);
            console.log('isUserWorking:', userIsWorking);
          }
        } else {
          console.log('Not sure what to do');
          console.log('currentAppCategory:', currentAppCategory);
        }
      } else if (currentAppCategory === UsedAppCategory.NOT_SET) {
        console.log('Not sure what to do');
      }
    });
  }

  handleUserActivityStateChange = (state: UserActivityState) => {
    switch (state) {
      case UserActivityState.ACTIVE:
        this.appEventEmitter.emit(TriciAppEvent.USER_ACTIVE);
        break;
      case UserActivityState.GOING_INACTIVE:
        this.appEventEmitter.emit(TriciAppEvent.USER_GOING_INACTIVE);
        break;
      case UserActivityState.INACTIVE:
        this.appEventEmitter.emit(TriciAppEvent.USER_INACTIVE);
        break;
      case UserActivityState.AWAY:
        this.appEventEmitter.emit(TriciAppEvent.USER_WENT_AWAY);
        break;
      case UserActivityState.BECOMING_HYPER_ACTIVE:
        this.appEventEmitter.emit(TriciAppEvent.USER_BECOMING_HYPER_ACTIVE);
        break;
      case UserActivityState.HYPER_ACTIVE:
        this.appEventEmitter.emit(TriciAppEvent.USER_HYPER_ACTIVE);
        break;
      case UserActivityState.IDLE:
        this.appEventEmitter.emit(TriciAppEvent.USER_IDLE);
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
    this.idleTimeServiceInstance.on('triciping', idleTime => this.handleTriciPing(idleTime));

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
    this.idleTimeServiceInstance.start();
    this.appObserverServiceInstance.start(isRunningInAsar);
  }

  async stop(): Promise<void> {
    this.idleTimeServiceInstance.stop();
    this.appObserverServiceInstance.stop();
    this.idleTimeServiceInstance.removeAllListeners();
    this.appObserverServiceInstance.removeAllListeners();
  }

  getUserActivityState(): UserActivityState {
    return this.userActivityStateMachine.getCurrentState();
  }
}
