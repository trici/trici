export enum TrayState {
  DEFAULT = 'DEFAULT',
  SESSION_IN_PROGRESS = 'SESSION_IN_PROGRESS',
}

export enum SESSION_STARTED_BY {
  NOT_SET = 'NOT_SET',
  USER = 'USER',
  TRICI_ACTIVITY = 'TRICI_ACTIVITY',
}

export enum SESSION_STARTED_FROM {
  NOT_SET = 'NOT_SET',
  TRAY = 'TRAY',
  CLI = 'CLI',
  SHORTCUT = 'SHORTCUT',
  APP_EVENT = 'APP_EVENT',
}

export enum CLI_MESSAGE_TYPE {
  START_FOCUS_SESSION = 'START_FOCUS_SESSION',
  STOP_FOCUS_SESSION = 'STOP_FOCUS_SESSION',
  GET_STATUS = 'GET_STATUS',
}

export enum IPC_SERVER_EVENTS {
  CONNECT = 'connect',
  PING = 'ping',
  CLI_MESSAGE = 'climessage',
  DISCONNECT = 'disconnect',
  ERROR = 'error',
}
export enum KEY_PARTS {
  FOCUS_SESSION = 'fcs',
  DAILY_USER_ACTIVITY = 'dua',
  USER_PREFERENCES = 'upref',
}

export enum TRICI_APP_EVENT {
  NOT_SET = 'not-set',
  FOCUS_SESSION_STARTED = 'focus-session-started',
  FOCUS_SESSION_ENDED = 'focus-session-ended',
  USER_CAME_BACK = 'user-came-back',
  USER_WENT_AWAY = 'user-went-away',
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

export enum NODE_ENV {
  PRODUCTION = 'production',
  DEVELOPMENT = 'development',
  TEST = 'test',
}

export enum PLATFORM {
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
