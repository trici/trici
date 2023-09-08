/**
 * All the entities that are used in the application.
 */
import * as Immutable from 'immutable';
import { Constants } from './Constants';
import { SESSION_STARTED_BY, SESSION_STARTED_FROM } from './enums';

interface IFocusSessionType {
  _id: string;
  startTime: number;
  endTime: number;
  name: string;
  idleTimeProfile: number[];
  sessionDidStart: boolean;
  recordingProcessCrashedOnStart: boolean;
  displayUnits: any[];
  screenToRecord: number;
  shouldHaveRecording: boolean;
  activities: any[];
  startedBy: SESSION_STARTED_BY;
  startedFrom: SESSION_STARTED_FROM;
}

const FocusSessionSchema: IFocusSessionType = {
  _id: 'uninintialized',
  startTime: 0,
  endTime: 0,
  name: Constants.EMPTY_STRING,
  idleTimeProfile: [],
  sessionDidStart: false,
  recordingProcessCrashedOnStart: false,
  displayUnits: [],
  screenToRecord: 0,
  shouldHaveRecording: true,
  activities: [],
  startedBy: SESSION_STARTED_BY.NOT_SET,
  startedFrom: SESSION_STARTED_FROM.NOT_SET,
};

const FocusSessionRecord = Immutable.Record(FocusSessionSchema);

export class FocusSession extends FocusSessionRecord {
  constructor(focusSession?: IFocusSessionType) {
    if (typeof focusSession === 'undefined' || focusSession === null) {
      super({
        _id: Constants.UNINITIALIZED_ID,
        startTime: 0,
        endTime: 0,
        name: '',
        idleTimeProfile: [],
        sessionDidStart: false,
        recordingProcessCrashedOnStart: false,
        displayUnits: [],
        screenToRecord: 0,
        shouldHaveRecording: false,
        activities: [],
        startedBy: SESSION_STARTED_BY.NOT_SET,
        startedFrom: SESSION_STARTED_FROM.NOT_SET,
      });
    } else {
      super({
        _id: focusSession._id,
        startTime: focusSession.startTime,
        endTime: focusSession.endTime,
        name: focusSession.name,
        idleTimeProfile: focusSession.idleTimeProfile,
        sessionDidStart: focusSession.sessionDidStart,
        recordingProcessCrashedOnStart: focusSession.recordingProcessCrashedOnStart,
        displayUnits: focusSession.displayUnits,
        screenToRecord: focusSession.screenToRecord,
        shouldHaveRecording: focusSession.shouldHaveRecording,
        activities: focusSession.activities,
        startedBy: focusSession.startedBy,
        startedFrom: focusSession.startedFrom,
      });
    }
  }
}
