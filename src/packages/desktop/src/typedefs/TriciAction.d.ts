import { SESSION_STARTED_BY, SESSION_STARTED_FROM, UsedApplicationRecord } from '@trici/models';
import { SettingsKey } from '../app/windows/settings/typedefs/SettingsWindowTypes';

export type TriciAction =
  | {
      type: 'OPEN_SETTINGS_WINDOW';
      args: { section: SettingsKey };
    }
  | {
      type: 'START_FOCUS_SESSION';
      startedBy: SESSION_STARTED_BY;
      startedFrom: SESSION_STARTED_FROM;
    }
  | {
      type: 'END_FOCUS_SESSION';
    }
  | {
      type: 'UPDATE_USED_APPLICATIONS';
      args: { usedApplications: Array<UsedApplicationRecord> };
    }
  | {
      type: 'ONBOARDING_FINISHED';
    }
  | {
      type: 'SHOW_HIDE_TRICI';
    }
  | {
      type: 'OPEN_FOCUS_SESSION_WINDOW';
    }
  | {
      type: 'RELOAD_OPEN_WINDOWS';
    }
  | {
      type: 'SHOW_ALERT_WINDOW';
      args: { alertType: AlertType; quitAppOnClose: boolean; message?: string };
    }
  | {
      type: 'CLOSE_ALERT_WINDOW';
    }
  | {
      type: 'CLEANUP_BEFORE_SHUTDOWN';
    }
  | {
      type: 'OPEN_SYSTEM_PREFERENCES';
    }
  | {
      type: 'OPEN_ONBOARDING_WINDOW';
    }
  | {
      type: 'CLOSE_ONBOARDING_WINDOW';
    }
  | {
      type: 'ASK_FOR_SCREEN_RECORDING_PERMISSIONS';
    };
