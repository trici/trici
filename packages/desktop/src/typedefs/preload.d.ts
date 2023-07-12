import { NODE_ENV, PLATFORM } from '@trici/models';

export interface IHandlerObject {
  handler: Function;
  handlerType: string;
}

export interface IRegisteredHandler {
  componentId: string;
  handler: Function;
  registeredHandlerTypes: string[];
}

export interface IMessageFromMain {
  success: boolean;
  handler: string;
  data: any;
  initValue: boolean;
}

export interface IBridgeAPIInterface {
  triciConfig: typeof config; // replace with the actual type of `config`
  env: typeof NODE_ENV;
  platform: typeof PLATFORM;
  send: (msg: any) => void; // replace `any` with the actual type of `msg`, if known
  appPath: string; // replace with the actual type of `appPath`
  query: (query: any) => void; // replace `any` with the actual type of `query`, if known
  registerQueryResultHandler: (handler: Function, handlerType: string) => void;
  sendMessage: (msg: any) => void; // replace `any` with the actual type of `msg`, if known
  registerReceiveHandlers: (
    componentId: string,
    handler: (message: IMessageFromMain) => void,
    registeredHandlerTypes: string[],
  ) => void;
  deregisterReceiveHandlers: (componentId: string) => void;
  getAllDisplays: () => Array<any>; // replace `any` with the actual type of `msg`, if known
  getInitValues: () => Array<IMessageFromMain>;
}
