import {
  Constants,
  FocusSession,
  SessionTrigger,
  KeyParts,
  TriciAppEvent,
  DisplayNotSelectedError,
  IFocusSession,
} from '@trici/models';
import { generateNewTriciId, generateUpdatedTriciId } from '@trici/utils';
import { screen } from 'electron';
import { IFocusSessionRepository } from '@trici/dal';
import { AppEventEmitter } from './AppEventEmitter';
import { TriciAction, SessionStartMetadata } from '../typedefs/TriciAction';
import { IActionDispatcher, dispatch } from './ActionDispatcher';
import { ITriciDesktopService } from '../typedefs/ITriciDesktopService';
import { IConsoleLogger, Logger } from '@trici/logger';
import { AppObserverService } from '@trici/app-observer';

export interface IFocusSessionService {
  startFocusSession(startTrigger: SessionTrigger, sessionStartMetadata: any): Promise<FocusSession>;
  endFocusSession(endTrigger: SessionTrigger): Promise<FocusSession>;
  isFocusSessionInProgress(): boolean;
  getCurrentFocusSession(): FocusSession | null;
}

export class FocusSessionService implements ITriciDesktopService, IFocusSessionService {
  #currentFocusSession: FocusSession | null;
  #focusSessionTimer: NodeJS.Timeout | null;
  #repository: IFocusSessionRepository;
  #lastNonAppEventEndTime: number = 0;
  appEventEmitter: AppEventEmitter;
  actionDispatcher: IActionDispatcher<TriciAction>;
  isServiceInitialized: boolean = false;
  getLogger: () => Logger | IConsoleLogger;
  appObserverService: AppObserverService;
  constructor(
    repository: IFocusSessionRepository,
    appObserverService: AppObserverService,
    appEventEmitter: AppEventEmitter,
    actionDispatcher: IActionDispatcher<TriciAction>,
    getLogger: () => Logger | IConsoleLogger,
  ) {
    this.#currentFocusSession = null;
    this.#repository = repository;
    this.#focusSessionTimer = null;
    this.appEventEmitter = appEventEmitter;
    this.actionDispatcher = actionDispatcher;
    this.isServiceInitialized = false;
    this.getLogger = getLogger;
    this.appObserverService = appObserverService;
  }

  static #createNewFocusSession = (
    startTrigger: SessionTrigger,
    sessionStartMetadata: SessionStartMetadata,
  ): FocusSession => {
    const displayUnits = screen.getAllDisplays();
    return new FocusSession({
      id: -1,
      startTime: Date.now(),
      endTime: 0,
      name: '',
      sessionDidStart: true,
      recordingProcessCrashedOnStart: false,
      displayUnits: displayUnits,
      shouldHaveRecording: true,
      startTrigger: startTrigger,
      endTrigger: SessionTrigger.NOT_SET,
      sessionStartMetadata: sessionStartMetadata,
      storageLocation: Constants.EMPTY_STRING,
    });
  };

  #registerActionHandlers = (): void => {
    this.actionDispatcher.register((action: TriciAction) => {
      switch (action.type) {
        case 'START_FOCUS_SESSION':
          this.#handleStartFocusSession(action.startTrigger, action.sessionStartMetadata);
          break;
        case 'END_FOCUS_SESSION':
          this.#handleEndFocusSession(action.endTrigger);
          break;
        default:
          break;
      }
    });
  };

  #registerAppEventHandlers = (): void => {
    this.appEventEmitter.on(TriciAppEvent.USER_INACTIVE, () => {
      if (this.isFocusSessionInProgress()) {
        dispatch({ type: 'END_FOCUS_SESSION', endTrigger: SessionTrigger.APP_EVENT });
      }
    });
    this.appEventEmitter.on(
      TriciAppEvent.USER_STARTED_WORKING,
      (data: {
        appEventData: {
          idleTimeNearHistoryAverage: number;
          idleTimeImmediateHistoryAverage: number;
          isAppSleeping: boolean;
        };
      }) => {
        if (data.appEventData.isAppSleeping) {
          this.getLogger().info('FocusSessionService: App is sleeping, skipping auto-start of Focus Session');
          return;
        }
        // Check if we're within the 3-minute cooldown period
        const now = Date.now();
        const cooldownPeriod = 3 * 60 * 1000; // 3 minutes in milliseconds

        const timeSinceLastNonAppEventEnd = now - this.#lastNonAppEventEndTime;
        const isInCooldownPeriod = this.#lastNonAppEventEndTime !== 0 && timeSinceLastNonAppEventEnd <= cooldownPeriod;

        if (!this.isFocusSessionInProgress()) {
          if (isInCooldownPeriod) {
            this.getLogger().info(
              `Skipping auto-start of Focus Session - in cooldown period (${(timeSinceLastNonAppEventEnd / 1000).toFixed(1)} seconds since last non-APP_EVENT session end)`,
            );
          } else {
            dispatch({
              type: 'START_FOCUS_SESSION',
              startTrigger: SessionTrigger.APP_EVENT,
              sessionStartMetadata: data,
            });
          }
        }
      },
    );
  };

  initService(): void {
    if (!this.isServiceInitialized) {
      this.#registerActionHandlers();
      this.#registerAppEventHandlers();
    }
    this.isServiceInitialized = true;
  }

  #handleStartFocusSession = async (startTrigger: SessionTrigger, sessionStartMetadata: any): Promise<void> => {
    try {
      const focusSession = await this.startFocusSession(startTrigger, sessionStartMetadata);
      this.getLogger().info('Focus session started: ', focusSession.toJS());
    } catch (error: any) {
      let response;
      response = { success: false, message: `Error starting focus session: ${error.message}` };
      dispatch({
        type: 'SHOW_ALERT_WINDOW',
        args: { alertType: 'ALERT_ERROR_MESSAGE', quitAppOnClose: false, message: response.message },
      });

      this.getLogger().error(response);
    }
  };

  #handleEndFocusSession = async (endTrigger: SessionTrigger): Promise<void> => {
    try {
      const focusSession = await this.endFocusSession(endTrigger);
      this.getLogger().info('Focus session ended: ', focusSession.toJS());
    } catch (error: any) {
      const focusSessionEndError = new Error(error.message);
      this.getLogger().error(focusSessionEndError.message);
    }
  };

  public async startFocusSession(startTrigger: SessionTrigger, sessionStartMetadata: any = {}): Promise<FocusSession> {
    if (this.isFocusSessionInProgress()) {
      throw new Error('Focus session already in progress');
    }
    const currentApp = this.appObserverService.getCurrentApp();
    if (!currentApp) {
      throw new Error('No current app found');
    }

    this.getLogger().debug('sessionStartMetadata:', sessionStartMetadata, { category: 'sessionStartMetadata' });

    const currentTimestamp = Date.now();
    const durationOfCurrentApp = currentApp?.timestamp ? currentTimestamp - currentApp.timestamp * 1000 : 0;
    let currentAppData = {
      appName: currentApp.appName,
      appDuration: durationOfCurrentApp,
    };

    const combinedSessionStartMetadata: SessionStartMetadata = {
      ...sessionStartMetadata,
      appData: currentAppData,
    };

    this.getLogger().debug('Session start metadata:', combinedSessionStartMetadata, {
      category: 'sessionStartMetadata',
    });

    try {
      // Reset the cooldown timer whenever a new session starts
      this.#lastNonAppEventEndTime = 0;

      this.#currentFocusSession = FocusSessionService.#createNewFocusSession(
        startTrigger,
        combinedSessionStartMetadata,
      );
      const saveResult = await this.#repository.save(this.#currentFocusSession);
      const savedFocusSession = new FocusSession(saveResult);
      this.#currentFocusSession = savedFocusSession;
      // this.#focusSessionTimer = setInterval(() => {}, 1000);
      this.appEventEmitter.emit(TriciAppEvent.FOCUS_SESSION_STARTED, savedFocusSession);
      return savedFocusSession;
    } catch (error: any) {
      this.getLogger().error('Error starting focus session: ' + error.message);
      throw new Error('Error starting focus session: ' + error.message);
    }
  }

  public async endFocusSession(endTrigger: SessionTrigger): Promise<FocusSession> {
    if (this.#currentFocusSession !== null) {
      try {
        const endTime = Date.now();
        const focusSessionToSave = this.#currentFocusSession.set('endTime', endTime).set('endTrigger', endTrigger);

        // Store the end time if it's not an APP_EVENT trigger
        if (endTrigger !== SessionTrigger.APP_EVENT) {
          this.#lastNonAppEventEndTime = endTime;
        }

        const saveResult = await this.#repository.save(focusSessionToSave);
        const savedFocusSession = new FocusSession(saveResult);
        this.#currentFocusSession = null;
        this.appEventEmitter.emit(TriciAppEvent.FOCUS_SESSION_ENDED, savedFocusSession);
        return savedFocusSession;
      } catch (error: any) {
        this.getLogger().error('Error ending focus session: ' + error.message);
        throw new Error('Error ending focus session: ' + error.message);
      }
    }
    throw new Error('No focus session in progress');
  }

  public isFocusSessionInProgress(): boolean {
    return this.#currentFocusSession !== null;
  }

  public getCurrentFocusSession(): FocusSession | null {
    return this.#currentFocusSession;
  }
}
