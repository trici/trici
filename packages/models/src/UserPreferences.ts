import * as Immutable from 'immutable';
import { Constants } from './Constants';

export interface IUserPreferences {
  _id: string;
  defaultScreenToRecord: number;
  globalShowHideShortcut: string;
  globalStartFocusSessionShortcut: string;
  globalStopFocusSessionShortcut: string;
};

const UserPreferencesSchema: IUserPreferences = {
  _id: Constants.UNINITIALIZED_ID,
  defaultScreenToRecord: Constants.UNINITIALIZED_NUMBER,
  globalShowHideShortcut: Constants.EMPTY_STRING,
  globalStartFocusSessionShortcut: Constants.EMPTY_STRING,
  globalStopFocusSessionShortcut: Constants.EMPTY_STRING,
};

const UserPreferencesRecord = Immutable.Record(UserPreferencesSchema);

export class UserPreferences extends UserPreferencesRecord {
  constructor(userPreferences?: IUserPreferences) {
    if (typeof userPreferences === 'undefined' || userPreferences === null) {
      super({
        _id: Constants.UNINITIALIZED_ID,
        defaultScreenToRecord: Constants.UNINITIALIZED_NUMBER,
        globalShowHideShortcut: Constants.EMPTY_STRING,
        globalStartFocusSessionShortcut: Constants.EMPTY_STRING,
        globalStopFocusSessionShortcut: Constants.EMPTY_STRING,
      });
    } else {
      super({
        _id: userPreferences._id,
        defaultScreenToRecord: userPreferences.defaultScreenToRecord,
        globalShowHideShortcut: userPreferences.globalShowHideShortcut,
        globalStartFocusSessionShortcut: userPreferences.globalStartFocusSessionShortcut,
        globalStopFocusSessionShortcut: userPreferences.globalStopFocusSessionShortcut,
      });
    }
  }
}
