export enum TrayState {
  DEFAULT = 'DEFAULT',
  SESSION_IN_PROGRESS = 'SESSION_IN_PROGRESS',
}

export enum SessionTrigger {
  NOT_SET = 'NOT_SET',
  TRAY = 'TRAY',
  CLI = 'CLI',
  SHORTCUT = 'SHORTCUT',
  APP_EVENT = 'APP_EVENT',
}

export enum CLIMessageType {
  START_FOCUS_SESSION = 'START_FOCUS_SESSION',
  STOP_FOCUS_SESSION = 'STOP_FOCUS_SESSION',
  GET_STATUS = 'GET_STATUS',
}

export enum IPCServerEvents {
  CONNECT = 'connect',
  PING = 'ping',
  CLI_MESSAGE = 'climessage',
  DISCONNECT = 'disconnect',
  ERROR = 'error',
}
export enum KeyParts {
  FOCUS_SESSION = 'fcs',
  DAILY_USER_ACTIVITY = 'dua',
  USER_PREFERENCES = 'upref',
}

export enum UserActivityState {
  IDLE = 'IDLE',
  ACTIVE = 'ACTIVE',
  GOING_INACTIVE = 'GOING_INACTIVE',
  INACTIVE = 'INACTIVE',
  AWAY = 'AWAY',
  BECOMING_HYPER_ACTIVE = 'BECOMING_HYPER_ACTIVE',
  HYPER_ACTIVE = 'HYPER_ACTIVE',
}

export enum ActivityTimeBounds {
  USER_WENT_AWAY_THRESHOLD = 600,
  INACTIVE_THRESHOLD = 200,
  GOING_INACTIVE_THRESHOLD = 90,
  IDLE_THRESHOLD = 30,
  NEAR_HISTORY_ACTIVE_THRESHOLD = 6,
  IMMEDIATE_HISTORY_BECOMING_HYPER_ACTIVE_THRESHOLD = 2,
  IMMEDIATE_HISTORY_HYPER_ACTIVE_THRESHOLD = 0.555,
}

export enum TriciAppEvent {
  NOT_SET = 'not-set',
  FOCUS_SESSION_STARTED = 'focus-session-started',
  FOCUS_SESSION_ENDED = 'focus-session-ended',
  USER_CAME_BACK = 'user-came-back',
  USER_WENT_AWAY = 'user-went-away',
  USER_IDLE = 'user-idle',
  USER_ACTIVE = 'user-active',
  USER_INACTIVE = 'user-inactive',
  USER_GOING_INACTIVE = 'user-going-inactive',
  USER_HYPER_ACTIVE = 'user-hyper-active',
  USER_BECOMING_HYPER_ACTIVE = 'user-becoming-hyper-active',
  SCREEN_RECORDING_PERMISSION_GRANTED = 'screen-recording-permission-granted',
  FRONTMOST_APP_CHANGED = 'frontmost-app-changed',
  USER_STARTED_WORKING = 'user-started-working',
  USER_STOPPED_WORKING = 'user-stopped-working',
  USER_MAY_BE_WORKING = 'user-may-be-working',
}

export enum IsUserWorking {
  YES = 'YES',
  NO = 'NO',
  MAYBE = 'MAYBE',
}

export enum NodeEnv {
  PRODUCTION = 'production',
  DEVELOPMENT = 'development',
  TEST = 'test',
}

export enum Platform {
  darwin = 'darwin',
  win32 = 'win32',
  linux = 'linux',
}

export enum AlertWindowMessageType {
  NONE = 'NONE',
  SCREEN_RECORDING_PERMISSION_REVOKED = 'SCREEN_RECORDING_PERMISSION_REVOKED',
}

// It is not clear what will be the category for the browser. Will it be 'PROBABLY_WORK' or 'PROBABLY_DISTRACT'?
export enum UsedAppCategory {
  NOT_SET = 0,
  DEFINITELY_WORK = 1,
  PROBABLY_WORK = 2,
  PROBABLY_DISTRACT = 3,
  DEFINITELY_DISTRACT = 4,
  COULD_BE_ANYTHING = 5,
}

export function getEnumKeyFromValue<T extends { [index: string]: string }>(enumObj: T, value: string): keyof T | null {
  for (const key in enumObj) {
    if (enumObj[key] === value) {
      return key as keyof T;
    }
  }
  return null;
}
