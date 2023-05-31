import { Constants, FocusSession, SESSION_STARTED_BY, KEY_PARTS, TRICI_APP_EVENT } from "@trici/models";
import { generateNewTriciId, generateUpdatedTriciId } from "@trici/utils";
import { screen } from "electron";
import { ITriciRepository } from "@trici/dal";
import  { AppEventEmitter } from "./AppEventEmitter";
export interface IFocusSessionService {
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

  constructor(repository: ITriciRepository, appEventEmitter: AppEventEmitter) {
    this.#currentFocusSession = null;
    this.#repository = repository;
    this.#focusSessionTimer = null;
    this.appEventEmitter = appEventEmitter;
  }

  static #createNewFocusSession = (startedBy: SESSION_STARTED_BY): FocusSession => {
    return new FocusSession({
      _id: generateNewTriciId(installationId, KEY_PARTS.FOCUS_SESSION),
      startTime: Date.now(),
      endTime: 0,
      name: "",
      idleTimeProfile: [],
      sessionDidStart: true,
      recordingProcessCrashedOnStart: false,
      displayUnits: screen.getAllDisplays(),
      shouldHaveRecording: true,
      activities: [],
      startedBy: startedBy,
    });
  };

  public async startFocusSession(startedBy: SESSION_STARTED_BY): Promise<FocusSession> {
    if (this.isFocusSessionInProgress()) {
      throw new Error("Focus session already in progress");
    }
    try {
      this.#currentFocusSession = FocusSessionService.#createNewFocusSession(startedBy);
      this.#repository.save(this.#currentFocusSession.toJS(), Constants.UNINITIALIZED_ID);
      this.#focusSessionTimer = setInterval(() => {}, 1000);
      this.appEventEmitter.emit(TRICI_APP_EVENT.FOCUS_SESSION_STARTED, this.#currentFocusSession);
      return this.#currentFocusSession;
    } catch (error: any) {
      throw new Error("Error starting focus session: " + error.message);
    }
  }

  public async endFocusSession(): Promise<FocusSession> {
    if (this.#currentFocusSession !== null) {
      try {
        // this.recorder.stopLiveRecording();
        const updatedId = generateUpdatedTriciId(this.#currentFocusSession.get("_id"));
        const endTime = Date.now();
        const idOfDocToDelete = this.#currentFocusSession.get("_id");
        const focusSessionToSave = this.#currentFocusSession.set("endTime", endTime).set("_id", updatedId);
        const savedSessionObject = await this.#repository.save(focusSessionToSave.toJS(), idOfDocToDelete);
        this.#currentFocusSession = null;
        const savedSession = new FocusSession(savedSessionObject);//FocusSession is immutable and object we get from repo is not.
        this.appEventEmitter.emit(TRICI_APP_EVENT.FOCUS_SESSION_ENDED, savedSession);
        return savedSession;
      } catch (error: any) {
        throw new Error("Error ending focus session: " + error.message);
      }
    }
    throw new Error("No focus session in progress");
  }

  public isFocusSessionInProgress(): boolean {
    return this.#currentFocusSession !== null;
  }

  public getCurrentFocusSession(): FocusSession | null {
    return this.#currentFocusSession;
  }
}
