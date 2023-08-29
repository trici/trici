import {
  Constants,
  FocusSession,
  SESSION_STARTED_BY,
  KEY_PARTS,
  TRICI_APP_EVENT,
  DisplayNotSelectedError,
} from '@trici/models';
import { generateNewTriciId, generateUpdatedTriciId } from '@trici/utils';
import { screen } from 'electron';
import { ITriciRepository } from '@trici/dal';
import { AppEventEmitter } from './AppEventEmitter';
import { TriciAction } from '../typedefs/TriciAction';
import { IActionDispatcher } from './ActionDispatcher';
export interface IFocusSessionService {
  registerActionHandlers(): void;
  startFocusSession(startedBy: SESSION_STARTED_BY): Promise<FocusSession>;
  endFocusSession(): Promise<FocusSession>;
  isFocusSessionInProgress(): boolean;
  getCurrentFocusSession(): FocusSession | null;
}

export class FocusSessionService implements IFocusSessionService {
  #currentFocusSession: FocusSession | null;
  #focusSessionTimer: NodeJS.Timeout | null;
  #repository: ITriciRepository;
  appEventEmitter: AppEventEmitter;
  actionDispatcher: IActionDispatcher<TriciAction>;
  actionHandlersRegistered: boolean = false;

  constructor(
    repository: ITriciRepository,
    appEventEmitter: AppEventEmitter,
    actionDispatcher: IActionDispatcher<TriciAction>,
  ) {
    this.#currentFocusSession = null;
    this.#repository = repository;
    this.#focusSessionTimer = null;
    this.appEventEmitter = appEventEmitter;
    this.actionDispatcher = actionDispatcher;
  }

  static #createNewFocusSession = (startedBy: SESSION_STARTED_BY): FocusSession => {
    return new FocusSession({
      _id: generateNewTriciId(installationId, KEY_PARTS.FOCUS_SESSION),
      startTime: Date.now(),
      endTime: 0,
      name: '',
      idleTimeProfile: [],
      sessionDidStart: true,
      recordingProcessCrashedOnStart: false,
      displayUnits: screen.getAllDisplays(),
      shouldHaveRecording: true,
      activities: [],
      startedBy: startedBy,
    });
  };

  registerActionHandlers(): void {
    if (!this.actionHandlersRegistered) {
      this.actionDispatcher.register((action: TriciAction) => {
        switch (action.type) {
          case 'START_FOCUS_SESSION':
            this._handleStartFocusSession(SESSION_STARTED_BY.USER);
            break;
          case 'END_FOCUS_SESSION':
            this._handleEndFocusSession();
            break;
          default:
            break;
        }
      });
    }
    this.actionHandlersRegistered = true;
  }

  private _handleStartFocusSession = async (startedBy: SESSION_STARTED_BY): Promise<void> => {
    try {
      const focusSession = await this.startFocusSession(startedBy);
      console.log('Focus session started: ', focusSession.toJS());
    } catch (error: any) {
      let response;
      if (error instanceof DisplayNotSelectedError) {
        response = {
          success: false,
          message:
            'Error starting focus session: Multiple monitors detected. Please set the default screen to record in the settings.',
        };
      } else {
        response = { success: false, message: `Error starting focus session: ${error.message}` };
      }
    }
  };

  private _handleEndFocusSession = async (): Promise<void> => {
    try {
      const focusSession = await this.endFocusSession();
      console.log('Focus session ended: ', focusSession.toJS());
    } catch (error: any) {
      const focusSessionEndError = new Error(error.message);
      console.log(focusSessionEndError.message);
    }
  };

  public async startFocusSession(startedBy: SESSION_STARTED_BY): Promise<FocusSession> {
    if (this.isFocusSessionInProgress()) {
      throw new Error('Focus session already in progress');
    }
    // Add rules to check if a focus session can be started
    // If there are multiple monitors, then the user should have preselcted the monitor on which the focus session should be recorded
    const displays = screen.getAllDisplays();
    if (displays.length > 1 && userPreferences.defaultScreenToRecord === Constants.UNINITIALIZED_NUMBER) {
      this.appEventEmitter.emit(TRICI_APP_EVENT.SESSION_STARTED_WITH_DISPLAY_TO_RECORD_NOT_SET, startedBy);
      throw new DisplayNotSelectedError();
    } else {
      try {
        this.#currentFocusSession = FocusSessionService.#createNewFocusSession(startedBy);
        this.#repository.save(this.#currentFocusSession.toJS(), Constants.UNINITIALIZED_ID);
        this.#focusSessionTimer = setInterval(() => {}, 1000);
        this.appEventEmitter.emit(TRICI_APP_EVENT.FOCUS_SESSION_STARTED, this.#currentFocusSession);
        return this.#currentFocusSession;
      } catch (error: any) {
        throw new Error('Error starting focus session: ' + error.message);
      }
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
