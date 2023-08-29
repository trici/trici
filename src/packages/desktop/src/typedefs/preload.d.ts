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

export interface IMessageFromRenderer {
  handler: string;
  args: any;
}

export interface IBridgeAPIInterface {
  triciConfig: typeof triciConfig; // replace with the actual type of `config`
  env: NODE_ENV | undefined;
  platform: PLATFORM | undefined;
  appPath: string; // replace with the actual type of `appPath`
  query: (query: any) => void; // replace `any` with the actual type of `query`, if known
  registerQueryResultHandler: (handler: Function, handlerType: string) => void;
  sendMessage: (msg: IMessageFromRenderer) => void; // replace `any` with the actual type of `msg`, if known
  registerReceiveHandlers: (
    componentId: string,
    handler: (message: IMessageFromMain) => void,
    registeredHandlerTypes: string[],
  ) => void;
  deregisterReceiveHandlers: (componentId: string) => void;
  getAllDisplays: () => Array<any>; // replace `any` with the actual type of `msg`, if known
  getInitValues: () => Array<IMessageFromMain>;
}
