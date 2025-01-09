import * as Immutable from 'immutable';
import { Constants } from './Constants';

export interface IUserPreferences {
  _id: string;
  globalShowHideShortcut: string | undefined;
  globalStartFocusSessionShortcut: string | undefined;
  globalStopFocusSessionShortcut: string | undefined;
}

const UserPreferencesSchema: IUserPreferences = {
  _id: Constants.UNINITIALIZED_ID,
  globalShowHideShortcut: undefined,
  globalStartFocusSessionShortcut: undefined,
  globalStopFocusSessionShortcut: undefined,
};

const UserPreferencesRecord = Immutable.Record(UserPreferencesSchema);

export class UserPreferences extends UserPreferencesRecord {
  constructor(userPreferences?: IUserPreferences) {
    if (typeof userPreferences === 'undefined' || userPreferences === null) {
      super({
        _id: Constants.UNINITIALIZED_ID,
        globalShowHideShortcut: undefined,
        globalStartFocusSessionShortcut: undefined,
        globalStopFocusSessionShortcut: undefined,
      });
    } else {
      super({
        _id: userPreferences._id,
        globalShowHideShortcut: userPreferences.globalShowHideShortcut,
        globalStartFocusSessionShortcut: userPreferences.globalStartFocusSessionShortcut,
        globalStopFocusSessionShortcut: userPreferences.globalStopFocusSessionShortcut,
      });
    }
  }
}
