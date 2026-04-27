import * as Immutable from 'immutable';

export interface IUserPreferences {
  globalShowHideShortcut: string | undefined;
  globalStartFocusSessionShortcut: string | undefined;
  globalStopFocusSessionShortcut: string | undefined;
  globalRecordVoiceNoteShortcut: string | undefined;
}

const UserPreferencesSchema: IUserPreferences = {
  globalShowHideShortcut: undefined,
  globalStartFocusSessionShortcut: undefined,
  globalStopFocusSessionShortcut: undefined,
  globalRecordVoiceNoteShortcut: undefined,
};

const UserPreferencesRecord = Immutable.Record(UserPreferencesSchema);

export class UserPreferences extends UserPreferencesRecord {
  constructor(userPreferences?: IUserPreferences) {
    if (typeof userPreferences === 'undefined' || userPreferences === null) {
      super({
        globalShowHideShortcut: undefined,
        globalStartFocusSessionShortcut: undefined,
        globalStopFocusSessionShortcut: undefined,
        globalRecordVoiceNoteShortcut: undefined,
      });
    } else {
      super({
        globalShowHideShortcut: userPreferences.globalShowHideShortcut,
        globalStartFocusSessionShortcut: userPreferences.globalStartFocusSessionShortcut,
        globalStopFocusSessionShortcut: userPreferences.globalStopFocusSessionShortcut,
        globalRecordVoiceNoteShortcut: userPreferences.globalRecordVoiceNoteShortcut,
      });
    }
  }
}
