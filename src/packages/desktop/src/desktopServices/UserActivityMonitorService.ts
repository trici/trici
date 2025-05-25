import * as fs from 'fs';
import { AppObserverService } from '@trici/app-observer';
import type { IConsoleLogger, Logger } from '@trici/logger';
import { Constants, DailyUserActivity, FocusSession, TriciAppEvent, UsedAppCategory, IAppEvent } from '@trici/models';
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
import { DataWriter } from '@trici/datawriter';
import { IAppEventRepository } from '@trici/dal';

export interface IUserActivityMonitorService {
  start(): Promise<void>;
  stop(): Promise<void>;
  getUserActivityState(): UserActivityState;
  isAppSleeping(): boolean;
}

export class UserActivityMonitorService implements ITriciDesktopService, IUserActivityMonitorService {
  appObserverServiceInstance: AppObserverService;
  getLogger: () => Logger | IConsoleLogger;
  userActivityStateMachine: UserActivityStateMachine;
  lastIdleTime: number;
  todaysUserActitivity: DailyUserActivity | null;
  appJsonStorageService: IAppJsonStorageService;
  appEventEmitter: AppEventEmitter;
  isServiceInitialized: boolean = false;
  actionDispatcher: IActionDispatcher<TriciAction>;
  usedApplicationsService: UsedApplicationsService;
  captureIdleTimeProfile: boolean = false;
  private _isAppSleeping: boolean = false;
  private _sleepTimer: NodeJS.Timeout | null = null;
  private idleTimeChunkNumber: number = 0;
  private idleTimeChunkProfile: { idleTime: number; timestamp: number }[] = [];
  private idleTimeChunkSessionStart: number | null = null;
  private appEventRepository: IAppEventRepository;

  constructor(
    getLogger: () => Logger | IConsoleLogger,
    appObserverServiceInstance: AppObserverService,
    appJsonStorageService: IAppJsonStorageService,
    appEventEmitter: AppEventEmitter,
    actionDispatcher: IActionDispatcher<TriciAction>,
    usedApplicationsService: UsedApplicationsService,
    userActivityStateMachine: UserActivityStateMachine,
    appEventRepository: IAppEventRepository,
  ) {
    this.getLogger = getLogger;
    this.appObserverServiceInstance = appObserverServiceInstance;
    this.userActivityStateMachine = userActivityStateMachine;
    this.lastIdleTime = -1;
    this.todaysUserActitivity = null;
    this.appJsonStorageService = appJsonStorageService;
    this.appEventEmitter = appEventEmitter;
    this.isServiceInitialized = false;
    this.actionDispatcher = actionDispatcher;
    this.usedApplicationsService = usedApplicationsService;
    this.captureIdleTimeProfile = false;
    this.appEventRepository = appEventRepository;
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

    if (this.captureIdleTimeProfile) {
      this.idleTimeChunkProfile.push({ idleTime, timestamp: Date.now() });
    }

    this.lastIdleTime = idleTime;
  };

  registerActionHandlers(): void {
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
        case 'APP_SLEEP_REQUESTED':
          this.startSleep(action.payload.durationMinutes);
          break;
        case 'APP_WAKE_UP_REQUESTED':
          this.wakeUp();
          break;
        case 'FINISH_WRITING_SEGMENT':
          this.writeEventsChunk(this.idleTimeChunkNumber);
          this.writeIdleTimeChunk();
          break;
        default:
          break;
      }
    });
  }
  writeEventsChunk(chunkNumber: number) {
    // Write asynchronously so triciping is never blocked
    (async () => {
      try {
        if (!this.idleTimeChunkSessionStart) {
          this.getLogger().info('UserActivityMonitorService: No active session to write events for');
          return;
        }

        const prefix = this.idleTimeChunkSessionStart;
        const paddedChunkNumber = chunkNumber.toString().padStart(4, '0');
        const chunkFileName = `${prefix}-events-chunk-${paddedChunkNumber}.csv`;
        const filePath = global.userDataDirectoryCheckResult.recordingsDir.path + '/' + prefix + '/' + chunkFileName;

        // Calculate the time range for this chunk
        // For chunk 0, use the session start time directly
        // For subsequent chunks, add the appropriate offset
        const chunkStartTime = chunkNumber === 0 ? prefix : prefix + chunkNumber * 15 * 1000;
        const chunkEndTime = chunkStartTime + 15 * 1000; // Add 15 seconds

        this.getLogger().info(
          `UserActivityMonitorService: Fetching events for chunk ${chunkNumber} from ${chunkStartTime} to ${chunkEndTime} (in milliseconds)`,
        );

        // Fetch events from the database for this time range
        const events = await this.appEventRepository.getAllAppEvents(chunkStartTime, chunkEndTime);

        // Write events to CSV file
        const fileContent = events
          .map((event: IAppEvent) => `${event.id},${event.type},${event.timestamp},${JSON.stringify(event.data)}`)
          .join('\n');

        await fs.promises.writeFile(filePath, fileContent);
        this.getLogger().info(`UserActivityMonitorService: Wrote ${events.length} events to ${chunkFileName}`);
      } catch (error) {
        this.getLogger().error(`UserActivityMonitorService: Error while writing events chunk: ${error}`);
      }
    })();
  }

  registerAppEventHandlers(): void {
    this.appEventEmitter.on(TriciAppEvent.FOCUS_SESSION_STARTED, (focusSession: FocusSession) => {
      this.captureIdleTimeProfile = true;
      this.idleTimeChunkNumber = 0;
      this.idleTimeChunkProfile = [];
      this.idleTimeChunkSessionStart = focusSession.get('startTime');
      if (this._isAppSleeping) {
        this.wakeUp();
      }
    });

    this.appEventEmitter.on(TriciAppEvent.FOCUS_SESSION_ENDED, async (focusSession: FocusSession) => {
      this.captureIdleTimeProfile = false;
      // Write any remaining chunk as when the session ends, the finishedWritingSegment event is not fired.
      await this.writeEventsChunk(this.idleTimeChunkNumber);
      await this.writeIdleTimeChunk();
      // Reset the idle time chunk number and profile for the next session.
      this.idleTimeChunkNumber = 0;
      this.idleTimeChunkProfile = [];
      this.idleTimeChunkSessionStart = null;
    });

    this.appEventEmitter.on(
      TriciAppEvent.USER_HYPER_ACTIVE,
      async ({ idleTimeNearHistoryAverage, idleTimeImmediateHistoryAverage, isAppSleeping }) => {
        console.log('UserHyperActive');
        this.getLogger().debug(`onUserHyperActive: ${idleTimeNearHistoryAverage}, ${idleTimeImmediateHistoryAverage}`, {
          category: 'sessionStartMetadata',
        });
        const currentAppDetails = await this.getCurrentAppDetails();
        await this.handleTriciAppEvent(
          currentAppDetails.currentApplication,
          currentAppDetails.currentAppCategory,
          TriciAppEvent.USER_HYPER_ACTIVE,
          {
            idleTimeNearHistoryAverage,
            idleTimeImmediateHistoryAverage,
            isAppSleeping,
          },
        );
      },
    );

    this.appEventEmitter.on(
      TriciAppEvent.USER_BECOMING_HYPER_ACTIVE,
      async ({ idleTimeNearHistoryAverage, idleTimeImmediateHistoryAverage, isAppSleeping }) => {
        // If the user is using a browser when hyperactive, then we want to know the url that
        // the user is browsing to figure out whether the user is working or leisure.
        // Thus I was thinking that we should enquire what is the url only when the user is hyperactive.
        // So we don't get to know the url when the user changes the tab in the browser. This is a problem.
        // Upon further investigation, to know the url when the user changes the tab in the browser etc., we
        // will need to build a browser extension.

        const appEventData = {
          idleTimeNearHistoryAverage,
          idleTimeImmediateHistoryAverage,
          isAppSleeping,
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
      isAppSleeping: boolean;
    },
  ) => {
    if (appEventData.isAppSleeping) {
      this.getLogger().info('UserActivityMonitorService: App is sleeping, skipping user started working event');
      return;
    }

    if (!currentApplication) {
      this.getLogger().error('UserActivityMonitorService.handleTriciAppEvent: No current application');
      return;
    }
    const currentTimestamp = Date.now();
    const durationOfCurrentApp = currentApplication?.timestamp
      ? currentTimestamp - currentApplication.timestamp * 1000
      : 0;

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
      isAppSleeping: boolean;
    },
  ) => {
    if (appEvent === TriciAppEvent.USER_BECOMING_HYPER_ACTIVE) {
      if (durationOfCurrentApp > 30 * 1000) {
        console.log('User might have started working');
        this.appEventEmitter.emit(TriciAppEvent.USER_STARTED_WORKING, {
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
    const eventData = {
      idleTimeNearHistoryAverage,
      idleTimeImmediateHistoryAverage,
      isAppSleeping: this._isAppSleeping,
    };

    switch (state) {
      case UserActivityState.ACTIVE:
        this.appEventEmitter.emit(TriciAppEvent.USER_ACTIVE, eventData);
        break;
      case UserActivityState.GOING_INACTIVE:
        this.appEventEmitter.emit(TriciAppEvent.USER_GOING_INACTIVE, eventData);
        break;
      case UserActivityState.INACTIVE:
        this.appEventEmitter.emit(TriciAppEvent.USER_INACTIVE, eventData);
        break;
      case UserActivityState.AWAY:
        this.appEventEmitter.emit(TriciAppEvent.USER_WENT_AWAY, eventData);
        break;
      case UserActivityState.BECOMING_HYPER_ACTIVE:
        this.appEventEmitter.emit(TriciAppEvent.USER_BECOMING_HYPER_ACTIVE, eventData);
        break;
      case UserActivityState.HYPER_ACTIVE:
        this.appEventEmitter.emit(TriciAppEvent.USER_HYPER_ACTIVE, eventData);
        break;
      case UserActivityState.IDLE:
        this.appEventEmitter.emit(TriciAppEvent.USER_IDLE, eventData);
        break;
      default:
        console.log('Unknown state');
        break;
    }
  };

  public initService(): void {
    if (!this.isServiceInitialized) {
      this.userActivityStateMachine.on('stateChanged', this.handleUserActivityStateChange);
      this.registerActionHandlers();
      this.registerAppEventHandlers();
      this.isServiceInitialized = true;
    }
  }

  async start(): Promise<void> {
    this.appObserverServiceInstance.on('idleTime', idleTime => this.handleTriciPing(idleTime));

    this.appObserverServiceInstance.on('frontmostAppChanged', (frontmostAppChangeData: any) => {
      this.getLogger().info(`UserActivityMonitorService frontmostAppChanged:${JSON.stringify(frontmostAppChangeData)}`);
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
    //   this.getLogger().error(`UserActivityMonitorService: Error while fetching today's user activity: ${err}`);
    // }
    this.appObserverServiceInstance.start(isRunningInAsar);
  }

  async stop(): Promise<void> {
    if (this._sleepTimer) {
      clearTimeout(this._sleepTimer);
      this._sleepTimer = null;
    }
    this._isAppSleeping = false;
    this.appObserverServiceInstance.stop();
    this.appObserverServiceInstance.removeAllListeners();
  }

  getUserActivityState(): UserActivityState {
    return this.userActivityStateMachine.getCurrentState();
  }

  public isAppSleeping(): boolean {
    return this._isAppSleeping;
  }

  private startSleep(durationMinutes: number) {
    this._isAppSleeping = true;

    if (this._sleepTimer) {
      clearTimeout(this._sleepTimer);
    }

    this._sleepTimer = setTimeout(() => this.wakeUp(), durationMinutes * 60 * 1000);

    this.appEventEmitter.emit(TriciAppEvent.APP_SLEEP_STARTED, {
      durationMinutes,
      wakeUpTime: new Date(Date.now() + durationMinutes * 60 * 1000),
      isAppSleeping: true,
    });
  }

  private wakeUp() {
    this._isAppSleeping = false;

    if (this._sleepTimer) {
      clearTimeout(this._sleepTimer);
      this._sleepTimer = null;
    }

    this.appEventEmitter.emit(TriciAppEvent.APP_SLEEP_ENDED, {
      isAppSleeping: false,
    });
  }

  private async writeIdleTimeChunk() {
    if (this.idleTimeChunkProfile.length === 0) {
      this.getLogger().info('UserActivityMonitorService: No idle time chunk to write');
      return;
    }
    // Copy the chunk data and clear the array immediately
    const chunkData = this.idleTimeChunkProfile.slice();
    const idleTimeChunkNumber = this.idleTimeChunkNumber;
    this.getLogger().info(`UserActivityMonitorService: Resetting idle time chunk profile and number`);
    this.idleTimeChunkProfile = [];
    this.idleTimeChunkNumber++;
    // Write asynchronously so triciping is never blocked
    (async () => {
      try {
        const protoBuffer = DataWriter.convertIdleTimeProfile(chunkData);
        const prefix = this.idleTimeChunkSessionStart;
        const paddedChunkNumber = idleTimeChunkNumber.toString().padStart(4, '0');
        const chunkFileName = `${prefix}-itp-chunk-${paddedChunkNumber}.dat`;
        const filePath = global.userDataDirectoryCheckResult.recordingsDir.path + '/' + prefix + '/' + chunkFileName;
        await fs.promises.writeFile(filePath, protoBuffer);
      } catch (error) {
        this.getLogger().error(`UserActivityMonitorService: Error while writing idle time chunk: ${error}`);
      }
    })();
  }
}
