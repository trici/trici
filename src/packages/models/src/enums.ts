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
  FOCUS_SESSION_STARTED = 'focus-session-started',
  FOCUS_SESSION_ENDED = 'focus-session-ended',
  USER_CAME_BACK = 'user-came-back',
  USER_WENT_AWAY = 'user-went-away',
  USER_ACTIVE = 'user-active',
  USER_INACTIVE = 'user-inactive',
  USER_GOING_INACTIVE = 'user-going-inactive',
  USER_HYPER_ACTIVE = 'user-hyper-active',
  USER_BECOMING_HYPER_ACTIVE = 'user-becoming-hyper-active',
  SESSION_STARTED_WITH_DISPLAY_TO_RECORD_NOT_SET = 'session-started-with-display-to-record-not-set',
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
  SCREEN_RECORDING_PERMISSION_REVOKED = 'SCREEN_RECORDING_PERMISSION_REVOKED',
  SCREEN_TO_RECORD_NOT_SET = 'SCREEN_TO_RECORD_NOT_SET',
}
