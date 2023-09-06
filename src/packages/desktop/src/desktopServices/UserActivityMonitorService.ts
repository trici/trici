import { IdleTimeServiceInstance } from './IdleTimeService';
import { AppObserverService } from '@trici/app-observer';
import { ITriciRepository } from '@trici/dal';
import type { Logger } from '@trici/logger';
import { Constants, DailyUserActivity, KEY_PARTS, TRICI_APP_EVENT } from '@trici/models';
import { generateNewTriciId, generateUpdatedTriciId, isTriciIdValidForToday } from '@trici/utils';
import { IAppJsonStorageService } from './AppJsonStorageService';
import { AppEventEmitter } from './AppEventEmitter';
import { ITriciDesktopService } from '../typedefs/ITriciDesktopService';
import { IActionDispatcher } from './ActionDispatcher';
import { TriciAction } from '../typedefs/TriciAction';

export interface IUserActivityMonitorService {
  start(): Promise<void>;
  stop(): Promise<void>;
}

export class UserActivityMonitorService implements ITriciDesktopService, IUserActivityMonitorService {
  idleTimeServiceInstance: IdleTimeServiceInstance;
  appObserverServiceInstance: AppObserverService;
  logger: Logger;
  lastIdleTime: number;
  userWentAwayAt: number;
  userCameBackAt: number;
  userBecameActiveAt: number;
  userBecameSuperActiveAt: number;
  userBecameHyperActiveAt: number;
  userHyperActiveForInSeconds: number;
  userBecameInactiveAt: number;
  repository: ITriciRepository;
  todaysUserActitivity: DailyUserActivity | null;
  appJsonStorageService: IAppJsonStorageService;
  appEventEmitter: AppEventEmitter;
  isServiceInitialized: boolean = false;
  actionDispatcher: IActionDispatcher<TriciAction>;

  constructor(
    logger: Logger,
    idleTimeServiceInstance: IdleTimeServiceInstance,
    appObserverServiceInstance: AppObserverService,
    repository: ITriciRepository,
    appJsonStorageService: IAppJsonStorageService,
    appEventEmitter: AppEventEmitter,
    actionDispatcher: IActionDispatcher<TriciAction>,
  ) {
    this.logger = logger;
    this.idleTimeServiceInstance = idleTimeServiceInstance;
    this.appObserverServiceInstance = appObserverServiceInstance;
    this.lastIdleTime = -1;
    this.userBecameActiveAt = 0;
    this.userBecameSuperActiveAt = 0;
    this.userBecameHyperActiveAt = 0;
    this.userHyperActiveForInSeconds = 0;
    this.userBecameInactiveAt = 0;
    this.userWentAwayAt = 0;
    this.userCameBackAt = 0;
    this.repository = repository;
    this.todaysUserActitivity = null;
    this.appJsonStorageService = appJsonStorageService;
    this.appEventEmitter = appEventEmitter;
    this.isServiceInitialized = false;
    this.actionDispatcher = actionDispatcher;
  }

  updateLastSavedTodayUserActivityId = async (udpatedId: string) => {
    let lastSavedEntityIds = await this.appJsonStorageService.getLastSavedEntityIds();
    lastSavedEntityIds = lastSavedEntityIds.set('todayUserActivityId', udpatedId);
    await this.appJsonStorageService.setLastSavedEntityIds(lastSavedEntityIds);
  };

  handleTriciPing = (idleTime: number) => {
    const idleTimeDiff = this.lastIdleTime - idleTime;
    if (idleTimeDiff > Constants.USER_WENT_AWAY_THRESHOLD) {
      console.log('user-came-back');
      this.appEventEmitter.emit(TRICI_APP_EVENT.USER_CAME_BACK);
      // mainWindow.webContents.send('receiveMessageRenderer', { handler: 'userCameBack', data: {} });
      this.userCameBackAt = Date.now();
      this.userBecameActiveAt = this.userCameBackAt;
      this.userBecameSuperActiveAt = this.userCameBackAt;
      this.userWentAwayAt = 0;
      this.userBecameInactiveAt = 0;
      // NotificationService.showUserCameBackNotification();
    } else if (idleTimeDiff > Constants.INACTIVE_ACTIVE_THRESHOLD) {
      console.log('user-active');
      this.appEventEmitter.emit(TRICI_APP_EVENT.USER_ACTIVE);
      // mainWindow.webContents.send('receiveMessageRenderer', { handler: 'userActive', data: {} });
      this.userBecameActiveAt = Date.now();
      this.userBecameSuperActiveAt = this.userBecameActiveAt;
      this.userBecameInactiveAt = 0;
    }
    if (idleTime > Constants.USER_WENT_AWAY_THRESHOLD) {
      if (this.userWentAwayAt === 0) {
        this.userWentAwayAt = Date.now();
        // mainWindow.webContents.send('receiveMessageRenderer', { handler: 'userWentAway', data: {} });
        console.log('user-went-away');
        this.appEventEmitter.emit(TRICI_APP_EVENT.USER_WENT_AWAY);
      }
    } else if (idleTime > Constants.INACTIVE_ACTIVE_THRESHOLD) {
      if (this.userBecameInactiveAt === 0) {
        // NotificationService.showSessionEndedNotification();
        console.log('user-inactive');
        this.appEventEmitter.emit(TRICI_APP_EVENT.USER_INACTIVE);
        // mainWindow.webContents.send('receiveMessageRenderer', { handler: 'userInactive', data: {} });
        this.userBecameInactiveAt = Date.now();
      }
    } else if (idleTime > Constants.GOING_INACTIVE_THRESHOLD && idleTime <= Constants.GOING_INACTIVE_THRESHOLD + 2) {
      console.log('user-going-inactive');
      this.appEventEmitter.emit(TRICI_APP_EVENT.USER_GOING_INACTIVE);
      // mainWindow.webContents.send('receiveMessageRenderer', { handler: 'userGoingInactive', data: {} });
      // NotificationService.showGoingInactiveNotification();
    } else if (idleTime < Constants.HYPER_ACTIVE_THRESHOLD) {
      if (this.userBecameHyperActiveAt === 0) {
        this.userBecameHyperActiveAt = Date.now();
      } else {
        this.userHyperActiveForInSeconds = (Date.now() - this.userBecameHyperActiveAt) / 1000;
        if (
          this.userHyperActiveForInSeconds > Constants.HYPER_ACTIVE_ZONE_BEGIN_TIME_IN_SECONDS &&
          this.userHyperActiveForInSeconds <= Constants.HYPER_ACTIVE_ZONE_BEGIN_TIME_IN_SECONDS + 2
        ) {
          console.log('user-becoming-hyper-active');
          console.log(TRICI_APP_EVENT.USER_BECOMING_HYPER_ACTIVE);
          this.appEventEmitter.emit(TRICI_APP_EVENT.USER_BECOMING_HYPER_ACTIVE, {});
          // NotificationService.useTrayToPromptToStart();
        } else if (
          this.userHyperActiveForInSeconds > Constants.HYPER_ACTIVE_ZONE_TIME_IN_SECONDS &&
          this.userHyperActiveForInSeconds <= Constants.HYPER_ACTIVE_ZONE_TIME_IN_SECONDS + 2
        ) {
          console.log('user-hyper-active');
          this.appEventEmitter.emit(TRICI_APP_EVENT.USER_HYPER_ACTIVE);
          // mainWindow.webContents.send('receiveMessageRenderer', { handler: 'userHyperActive', data: {} });
          // NotificationService.useTrayToPromptToStart();
          // NotificationService.showPromptToStartFocusSession();
          // set userBecameHyperActiveAt to zero after 5 minutes
          const self = this;
          setTimeout(() => {
            self.userBecameHyperActiveAt = 0;
          }, 300000);
        }
      }
    } else if (this.userBecameHyperActiveAt !== 0) {
      this.userBecameHyperActiveAt = 0;
      this.userHyperActiveForInSeconds = (Date.now() - this.userBecameHyperActiveAt) / 1000;
      if (this.userHyperActiveForInSeconds > Constants.HYPER_ACTIVE_ZONE_TIME_IN_SECONDS) {
        //mainWindow.webContents.send('receiveMessageRenderer', { handler: 'userHyperActiveEnd', data: {} });
      }
    }
    this.lastIdleTime = idleTime;
  };

  registerActionHandlers(): void {
    // TODO: Register any action handlers that this service needs to handle
    this.actionDispatcher.register((action: TriciAction) => {
      switch (action.type) {
        case 'CLEANUP_BEFORE_SHUTDOWN':
          this.stop();
          break;
        default:
          break;
      }
    });
  }

  registerAppEventHandlers(): void {
    // TODO: Register any app event handlers that this service needs to handle
  }

  public initService(): void {
    if (!this.isServiceInitialized) {
      this.registerActionHandlers();
      this.registerAppEventHandlers();
      this.isServiceInitialized = true;
    }
  }

  async start(): Promise<void> {
    //Register event handlers to handle events from the services.
    this.idleTimeServiceInstance.on('triciping', idleTime => this.handleTriciPing(idleTime));

    this.appObserverServiceInstance.on('frontmostAppChanged', (frontmostAppChangeData: any) => {
      this.logger.info(`UserActivityMonitorService frontmostAppChanged:${frontmostAppChangeData}`);
      // TODO: Save the data to the db. I am wondering whether there should be a BLL.
      if (this.todaysUserActitivity !== null) {
        try {
          const frontmostAppChanges = this.todaysUserActitivity.get('frontmostAppChanges');
          // const frontmostAppChangeDataObject = JSON.parse(frontmostAppChangeData);
          frontmostAppChanges.push(frontmostAppChangeData);
          const idOfDocToDelete = this.todaysUserActitivity.get('_id');

          const updatedId =
            idOfDocToDelete === Constants.UNINITIALIZED_ID
              ? generateNewTriciId(installationId, KEY_PARTS.USER_PREFERENCES)
              : generateUpdatedTriciId(idOfDocToDelete);

          this.todaysUserActitivity = this.todaysUserActitivity.withMutations(obj => {
            obj.set('_id', updatedId).set('frontmostAppChanges', frontmostAppChanges);
          });
          this.repository.save(this.todaysUserActitivity.toJS(), idOfDocToDelete);
          this.updateLastSavedTodayUserActivityId(updatedId);
        } catch (err) {
          this.logger.error(`UserActivityMonitorService: Error while saving frontmostAppChanged: ${err}`);
        }
      }
    });

    try {
      // Fetch the current user activity from the db.
      // If there is no user activity for today, create one.
      let lastSavedEntityIds = await this.appJsonStorageService.getLastSavedEntityIds();
      let todayUserActivityId = lastSavedEntityIds.get('todayUserActivityId');
      if (
        todayUserActivityId === undefined ||
        todayUserActivityId === Constants.UNINITIALIZED_ID ||
        !isTriciIdValidForToday(todayUserActivityId)
      ) {
        todayUserActivityId = generateNewTriciId(installationId, KEY_PARTS.DAILY_USER_ACTIVITY);
      }

      let result = await this.repository.get(todayUserActivityId);
      if (result === null) {
        this.todaysUserActitivity = new DailyUserActivity();
        this.todaysUserActitivity = this.todaysUserActitivity.set('_id', todayUserActivityId);
        this.repository.save(this.todaysUserActitivity.toJS(), Constants.UNINITIALIZED_ID);
        this.updateLastSavedTodayUserActivityId(todayUserActivityId);
      }
      this.todaysUserActitivity = new DailyUserActivity(result);
    } catch (err) {
      this.logger.error(`UserActivityMonitorService: Error while fetching today's user activity: ${err}`);
    }
    this.idleTimeServiceInstance.start();
    this.appObserverServiceInstance.start(isRunningInAsar);
  }

  async stop(): Promise<void> {
    this.idleTimeServiceInstance.stop();
    this.appObserverServiceInstance.stop();
    this.idleTimeServiceInstance.removeAllListeners();
    this.appObserverServiceInstance.removeAllListeners();
  }
}
