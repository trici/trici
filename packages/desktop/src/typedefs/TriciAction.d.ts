import { SettingsKey } from '../app/windows/settings/typedefs/SettingsWindowTypes';

export type TriciAction =
  | {
      type: 'OPEN_SETTINGS_WINDOW';
      args: { section: SettingsKey };
    }
  | {
      type: 'OPEN_FOCUS_SESSION_WINDOW';
    }
  | {
      type: 'RELOAD_OPEN_WINDOWS';
    }
  | {
      type: 'SHOW_ALERT_WINDOW';
      args: { alertType: AlertType; quitAppOnClose: boolean };
    }
  | {
      type: 'OPEN_SYSTEM_PREFERENCES_CLOSE_ALERT';
    };
