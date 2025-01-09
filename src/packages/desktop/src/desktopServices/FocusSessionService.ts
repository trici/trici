import {
  Constants,
  FocusSession,
  SessionStartedBy,
  KeyParts,
  TriciAppEvent,
  DisplayNotSelectedError,
  SessionStartedFrom,
  IFocusSession,
} from '@trici/models';
import { generateNewTriciId, generateUpdatedTriciId } from '@trici/utils';
import { screen } from 'electron';
import { IFocusSessionRepository } from '@trici/dal';
import { AppEventEmitter } from './AppEventEmitter';
import { TriciAction } from '../typedefs/TriciAction';
import { IActionDispatcher, dispatch } from './ActionDispatcher';
import { ITriciDesktopService } from '../typedefs/ITriciDesktopService';
export interface IFocusSessionService {
  startFocusSession(
    startedBy: SessionStartedBy,
    startedFrom: SessionStartedFrom,
    sessionStartMetadata?: any,
  ): Promise<FocusSession>;
  endFocusSession(): Promise<FocusSession>;
  isFocusSessionInProgress(): boolean;
  getCurrentFocusSession(): FocusSession | null;
}

export class FocusSessionService implements ITriciDesktopService, IFocusSessionService {
  #currentFocusSession: FocusSession | null;
  #focusSessionTimer: NodeJS.Timeout | null;
  #repository: IFocusSessionRepository;
  appEventEmitter: AppEventEmitter;
  actionDispatcher: IActionDispatcher<TriciAction>;
  isServiceInitialized: boolean = false;

  constructor(
    repository: IFocusSessionRepository,
    appEventEmitter: AppEventEmitter,
    actionDispatcher: IActionDispatcher<TriciAction>,
  ) {
    this.#currentFocusSession = null;
    this.#repository = repository;
    this.#focusSessionTimer = null;
    this.appEventEmitter = appEventEmitter;
    this.actionDispatcher = actionDispatcher;
    this.isServiceInitialized = false;
  }

  static #createNewFocusSession = (
    startedBy: SessionStartedBy,
    startedFrom: SessionStartedFrom,
    sessionStartMetadata: {
      appName: string;
      durationOfCurrentApp: number;
      appEventData: {
        idleTimeNearHistoryAverage: number;
        idleTimeImmediateHistoryAverage: number;
      };
    },
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
      startedBy: startedBy,
      startedFrom: startedFrom,
      sessionStartMetadata: sessionStartMetadata,
    });
  };

  #registerActionHandlers = (): void => {
    this.actionDispatcher.register((action: TriciAction) => {
      switch (action.type) {
        case 'START_FOCUS_SESSION':
          this.#handleStartFocusSession(action.startedBy, action.startedFrom, action.sessionStartMetadata);
          break;
        case 'END_FOCUS_SESSION':
          this.#handleEndFocusSession();
          break;
        default:
          break;
      }
    });
  };

  #registerAppEventHandlers = (): void => {
    this.appEventEmitter.on(TriciAppEvent.USER_INACTIVE, () => {
      if (this.isFocusSessionInProgress()) {
        dispatch({ type: 'END_FOCUS_SESSION' });
      }
    });
    this.appEventEmitter.on(
      TriciAppEvent.USER_STARTED_WORKING,
      (
        appName: string,
        durationOfCurrentApp: number,
        appEventData: {
          idleTimeNearHistoryAverage: number;
          idleTimeImmediateHistoryAverage: number;
        },
      ) => {
        if (!this.isFocusSessionInProgress()) {
          dispatch({
            type: 'START_FOCUS_SESSION',
            startedBy: SessionStartedBy.TRICI_ACTIVITY,
            startedFrom: SessionStartedFrom.APP_EVENT,
            sessionStartMetadata: {
              appName,
              durationOfCurrentApp,
              appEventData,
            },
          });
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

  #handleStartFocusSession = async (
    startedBy: SessionStartedBy,
    startedFrom: SessionStartedFrom,
    sessionStartMetadata: {
      appName: string;
      durationOfCurrentApp: number;
      appEventData: {
        idleTimeNearHistoryAverage: number;
        idleTimeImmediateHistoryAverage: number;
      };
    },
  ): Promise<void> => {
    try {
      const focusSession = await this.startFocusSession(startedBy, startedFrom, sessionStartMetadata);
      console.log('Focus session started: ', focusSession.toJS());
    } catch (error: any) {
      let response;
      response = { success: false, message: `Error starting focus session: ${error.message}` };
      dispatch({
        type: 'SHOW_ALERT_WINDOW',
        args: { alertType: 'ALERT_ERROR_MESSAGE', quitAppOnClose: false, message: response.message },
      });

      console.log(response);
    }
  };

  #handleEndFocusSession = async (): Promise<void> => {
    try {
      const focusSession = await this.endFocusSession();
      console.log('Focus session ended: ', focusSession.toJS());
    } catch (error: any) {
      const focusSessionEndError = new Error(error.message);
      console.log(focusSessionEndError.message);
    }
  };

  public async startFocusSession(
    startedBy: SessionStartedBy,
    startedFrom: SessionStartedFrom,
    sessionStartMetadata: any = {},
  ): Promise<FocusSession> {
    if (this.isFocusSessionInProgress()) {
      throw new Error('Focus session already in progress');
    }

    try {
      this.#currentFocusSession = FocusSessionService.#createNewFocusSession(
        startedBy,
        startedFrom,
        sessionStartMetadata,
      );
      const saveResult = await this.#repository.save(this.#currentFocusSession);
      const savedFocusSession = new FocusSession(saveResult);
      this.#currentFocusSession = savedFocusSession;
      this.#focusSessionTimer = setInterval(() => {}, 1000);
      this.appEventEmitter.emit(TriciAppEvent.FOCUS_SESSION_STARTED, savedFocusSession);
      return savedFocusSession;
    } catch (error: any) {
      throw new Error('Error starting focus session: ' + error.message);
    }
  }

  public async endFocusSession(): Promise<FocusSession> {
    if (this.#currentFocusSession !== null) {
      try {
        const endTime = Date.now();
        const focusSessionToSave = this.#currentFocusSession.set('endTime', endTime);

        const saveResult = await this.#repository.save(focusSessionToSave);
        const savedFocusSession = new FocusSession(saveResult);
        this.#currentFocusSession = null;
        this.appEventEmitter.emit(TriciAppEvent.FOCUS_SESSION_ENDED, savedFocusSession);
        return savedFocusSession;
      } catch (error: any) {
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
