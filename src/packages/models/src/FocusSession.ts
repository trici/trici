/**
 * All the entities that are used in the application.
 */
import * as Immutable from 'immutable';
import { Constants } from './Constants';
import { SessionTrigger } from './enums';

export interface IFocusSession {
  id: number;
  startTime: number;
  endTime: number;
  name: string;
  sessionDidStart: boolean;
  recordingProcessCrashedOnStart: boolean;
  displayUnits: any[];
  shouldHaveRecording: boolean;
  startTrigger: SessionTrigger;
  endTrigger: SessionTrigger;
  sessionStartMetadata: any;
  storageLocation: string;
}

const FocusSessionSchema: IFocusSession = {
  id: 0,
  startTime: 0,
  endTime: 0,
  name: Constants.EMPTY_STRING,
  sessionDidStart: false,
  recordingProcessCrashedOnStart: false,
  displayUnits: [],
  shouldHaveRecording: true,
  startTrigger: SessionTrigger.NOT_SET,
  endTrigger: SessionTrigger.NOT_SET,
  sessionStartMetadata: {},
  storageLocation: Constants.EMPTY_STRING,
};

const FocusSessionRecord = Immutable.Record(FocusSessionSchema);

export class FocusSession extends FocusSessionRecord {
  constructor(focusSession?: IFocusSession) {
    if (typeof focusSession === 'undefined' || focusSession === null) {
      super({
        id: Constants.UNINITIALIZED_NUMBER,
        startTime: 0,
        endTime: 0,
        name: Constants.EMPTY_STRING,
        sessionDidStart: false,
        recordingProcessCrashedOnStart: false,
        displayUnits: [],
        shouldHaveRecording: false,
        startTrigger: SessionTrigger.NOT_SET,
        endTrigger: SessionTrigger.NOT_SET,
        sessionStartMetadata: {},
        storageLocation: Constants.EMPTY_STRING,
      });
    } else {
      super({
        id: focusSession.id,
        startTime: focusSession.startTime,
        endTime: focusSession.endTime,
        name: focusSession.name,
        sessionDidStart: focusSession.sessionDidStart,
        recordingProcessCrashedOnStart: focusSession.recordingProcessCrashedOnStart,
        displayUnits: focusSession.displayUnits,
        shouldHaveRecording: focusSession.shouldHaveRecording,
        startTrigger: focusSession.startTrigger,
        endTrigger: focusSession.endTrigger,
        sessionStartMetadata: focusSession.sessionStartMetadata,
        storageLocation: focusSession.storageLocation,
      });
    }
  }
}
