
export enum TrayState {
  DEFAULT = 'DEFAULT',
  SESSION_IN_PROGRESS = 'SESSION_IN_PROGRESS',
}

export enum SESSION_STARTED_BY {
  NOT_SET = 'NOT_SET',
  USER = 'USER',
  TRICI_ACTIVITY = 'TRICI_ACTIVITY',
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
}
