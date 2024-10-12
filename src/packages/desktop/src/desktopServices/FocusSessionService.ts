import {
  Constants,
  FocusSession,
  SESSION_STARTED_BY,
  KEY_PARTS,
  TRICI_APP_EVENT,
  DisplayNotSelectedError,
  SESSION_STARTED_FROM,
} from '@trici/models';
import { generateNewTriciId, generateUpdatedTriciId } from '@trici/utils';
import { screen } from 'electron';
import { ITriciDocRepository } from '@trici/dal';
import { AppEventEmitter } from './AppEventEmitter';
import { TriciAction } from '../typedefs/TriciAction';
import { IActionDispatcher, dispatch } from './ActionDispatcher';
import { ITriciDesktopService } from '../typedefs/ITriciDesktopService';
export interface IFocusSessionService {
  startFocusSession(startedBy: SESSION_STARTED_BY, startedFrom: SESSION_STARTED_FROM): Promise<FocusSession>;
  endFocusSession(): Promise<FocusSession>;
  isFocusSessionInProgress(): boolean;
  getCurrentFocusSession(): FocusSession | null;
}

export class FocusSessionService implements ITriciDesktopService, IFocusSessionService {
  #currentFocusSession: FocusSession | null;
  #focusSessionTimer: NodeJS.Timeout | null;
  #repository: ITriciDocRepository;
  appEventEmitter: AppEventEmitter;
  actionDispatcher: IActionDispatcher<TriciAction>;
  isServiceInitialized: boolean = false;

  constructor(
    repository: ITriciDocRepository,
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

  static #createNewFocusSession = (startedBy: SESSION_STARTED_BY, startedFrom: SESSION_STARTED_FROM): FocusSession => {
    const displayUnits = screen.getAllDisplays();
    return new FocusSession({
      _id: generateNewTriciId(installationId, KEY_PARTS.FOCUS_SESSION),
      startTime: Date.now(),
      endTime: 0,
      name: '',
      idleTimeProfile: [],
      sessionDidStart: true,
      recordingProcessCrashedOnStart: false,
      displayUnits: displayUnits,
      shouldHaveRecording: true,
      activities: [],
      startedBy: startedBy,
      startedFrom: startedFrom,
    });
  };

  #registerActionHandlers = (): void => {
    this.actionDispatcher.register((action: TriciAction) => {
      switch (action.type) {
        case 'START_FOCUS_SESSION':
          this.#handleStartFocusSession(action.startedBy, action.startedFrom);
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
    this.appEventEmitter.on(TRICI_APP_EVENT.USER_INACTIVE, () => {
      if (this.isFocusSessionInProgress()) {
        dispatch({ type: 'END_FOCUS_SESSION' });
      }
    });
    this.appEventEmitter.on(TRICI_APP_EVENT.USER_STARTED_WORKING, () => {
      if (!this.isFocusSessionInProgress()) {
        dispatch({
          type: 'START_FOCUS_SESSION',
          startedBy: SESSION_STARTED_BY.TRICI_ACTIVITY,
          startedFrom: SESSION_STARTED_FROM.APP_EVENT,
        });
      }
    });
  };

  initService(): void {
    if (!this.isServiceInitialized) {
      this.#registerActionHandlers();
      this.#registerAppEventHandlers();
    }
    this.isServiceInitialized = true;
  }

  #handleStartFocusSession = async (
    startedBy: SESSION_STARTED_BY,
    startedFrom: SESSION_STARTED_FROM,
  ): Promise<void> => {
    try {
      const focusSession = await this.startFocusSession(startedBy, startedFrom);
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
    startedBy: SESSION_STARTED_BY,
    startedFrom: SESSION_STARTED_FROM,
  ): Promise<FocusSession> {
    if (this.isFocusSessionInProgress()) {
      throw new Error('Focus session already in progress');
    }
    // Add rules to check if a focus session can be started
    // Removing the below business rule as the improved recorder can record the active screen amongst multiple screens.
    // If there are multiple monitors, then the user should have preselcted the monitor on which the focus session should be recorded
      try {
        this.#currentFocusSession = FocusSessionService.#createNewFocusSession(startedBy, startedFrom);
        this.#repository.save(this.#currentFocusSession.toJS(), Constants.UNINITIALIZED_ID);
        this.#focusSessionTimer = setInterval(() => {}, 1000);
        this.appEventEmitter.emit(TRICI_APP_EVENT.FOCUS_SESSION_STARTED, this.#currentFocusSession);
        return this.#currentFocusSession;
      } catch (error: any) {
        throw new Error('Error starting focus session: ' + error.message);
      }
  }

  public async endFocusSession(): Promise<FocusSession> {
    if (this.#currentFocusSession !== null) {
      try {
        const updatedId = generateUpdatedTriciId(this.#currentFocusSession.get('_id'));
        const endTime = Date.now();
        const idOfDocToDelete = this.#currentFocusSession.get('_id');
        const focusSessionToSave = this.#currentFocusSession.set('endTime', endTime).set('_id', updatedId);
        console.log('Current focus session: ', this.#currentFocusSession.toJS());
        console.log('Focus session to save: ', focusSessionToSave.toJS());
        console.log('Id of doc to delete: ', idOfDocToDelete);
        // Is it correct to expect the repository to return the saved document?
        // Right now it is just returning the pouchDB response which contains the id and rev of the saved document
        const response = await this.#repository.save(focusSessionToSave.toJS(), idOfDocToDelete);
        this.#currentFocusSession = null;
        this.appEventEmitter.emit(TRICI_APP_EVENT.FOCUS_SESSION_ENDED, focusSessionToSave);
        return focusSessionToSave;
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
