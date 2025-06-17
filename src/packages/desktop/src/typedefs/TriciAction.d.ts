import { SessionStartedBy, SESSION_STARTED_FROM, UsedApplicationRecord, SessionTrigger } from '@trici/models';
import { SettingsKey } from '../app/windows/settings/typedefs/SettingsWindowTypes';

export type SessionStartMetadata = {
  appData: {
    appName: string;
    appDuration: number;
  };
  [key: string]: any;
};

export type TriciAction =
  | {
      type: 'OPEN_SETTINGS_WINDOW';
      args: { section: SettingsKey };
    }
  | {
      type: 'START_FOCUS_SESSION';
      startTrigger: SessionTrigger;
      sessionStartMetadata: any;
    }
  | {
      type: 'END_FOCUS_SESSION';
      endTrigger: SessionTrigger;
    }
  | {
      type: 'FINISH_WRITING_SEGMENT';
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
      type: 'OPEN_EVENT_VIEWER_WINDOW';
    }
  | {
      type: 'ASK_FOR_SCREEN_RECORDING_PERMISSIONS';
    }
  | {
      type: 'ASK_FOR_ACCESSIBILITY_PERMISSIONS';
    }
  | {
      type: 'PING_FUNCTION';
    }
  | {
      type: 'APP_SLEEP_REQUESTED';
      payload: {
        durationMinutes: number;
      };
    }
  | {
      type: 'APP_WAKE_UP_REQUESTED';
    }
  | {
      type: 'RECORD_VOICE_NOTE';
    }
  | {
      type: 'ASK_FOR_MICROPHONE_PERMISSIONS';
    };
