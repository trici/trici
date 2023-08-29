import { SettingsKey } from '../app/windows/settings/typedefs/SettingsWindowTypes';

export type TriciAction =
  | {
      type: 'OPEN_SETTINGS_WINDOW';
      args: { section: SettingsKey };
    }
  | {
      type: 'START_FOCUS_SESSION';
    }
  | {
      type: 'END_FOCUS_SESSION';
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
      type: 'CLOSE_ALERT_WINDOW';
    }
  | {
      type: 'OPEN_SYSTEM_PREFERENCES';
    };
