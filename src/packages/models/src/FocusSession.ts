/**
 * All the entities that are used in the application.
 */
import * as Immutable from 'immutable';
import { Constants } from './Constants';
import { SessionStartedBy, SessionStartedFrom } from './enums';

interface IFocusSessionType {
  _id: string;
  startTime: number;
  endTime: number;
  name: string;
  idleTimeProfile: number[];
  sessionDidStart: boolean;
  recordingProcessCrashedOnStart: boolean;
  displayUnits: any[];
  shouldHaveRecording: boolean;
  activities: any[];
  startedBy: SessionStartedBy;
  startedFrom: SessionStartedFrom;
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
  shouldHaveRecording: true,
  activities: [],
  startedBy: SessionStartedBy.NOT_SET,
  startedFrom: SessionStartedFrom.NOT_SET,
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
        shouldHaveRecording: false,
        activities: [],
        startedBy: SessionStartedBy.NOT_SET,
        startedFrom: SessionStartedFrom.NOT_SET,
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
        shouldHaveRecording: focusSession.shouldHaveRecording,
        activities: focusSession.activities,
        startedBy: focusSession.startedBy,
        startedFrom: focusSession.startedFrom,
      });
    }
  }
}
