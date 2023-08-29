import { IBridgeAPIInterface } from './typedefs/preload';
import { NODE_ENV, PLATFORM } from '@trici/models';

const { contextBridge, ipcRenderer } = require('electron');

console.log('Loading preload.js');

const node_env = process.env.NODE_ENV as NODE_ENV | undefined;
const platform = process.platform as PLATFORM | undefined;

const appPath = ipcRenderer.sendSync('getAppPath', {});
const triciConfig = ipcRenderer.sendSync('getConfig', {});

console.log('config:', triciConfig);

type QueryResultHandler = {
  handler: Function;
  handlerType: string;
};

type messageHandler = {
  componentId: string;
  handler: Function;
  registeredHandlerTypes: string[];
};

let registeredQueryResultHandlers: Array<QueryResultHandler> = [];
let registeredMessageHandlers: Array<messageHandler> = [];

let initValues: any[] = [];

ipcRenderer.on('queryRepoResult', (event, result) => {
  console.log('Inside queryRepoResult:', result);
  const foundHandler = registeredQueryResultHandlers.find(obj => obj.handlerType === result.handler);
  if (foundHandler) {
    foundHandler.handler(result);
    // maybe remove the registered query handler
    const handleType = result.handler.split('-')[0];
    registeredQueryResultHandlers = registeredQueryResultHandlers.filter(
      handler => handler.handlerType.split('-')[0] !== handleType,
    );
  } else {
    console.error(`No handler found on receiveQueryResult for ${result.handler}`);
    ipcRenderer.send('sendMessageMain', {
      handler: 'rendererLog',
      args: {
        msg: `No handler found on receiveQueryResult renderer for ${result.handler}`,
      },
    });
  }
});

ipcRenderer.on('messageFromMain', (event, response) => {
  if (response.initValue) {
    initValues.push(response);
    console.log('Added initValue:', response);
  } else if (response.handler === 'sleep') {
    ipcRenderer.send('sendMessageMain', {
      handler: 'askAfter',
      args: { askAfter: response.data.sleepTime },
    });
  } else {
    const handlersWhichAreRegisteredLaterInTheAppLifecyle = [
      'triciping',
      'userHyperActive',
      'userHyperActiveEnd',
      'userGoingInactive',
      'userWentAway',
    ];
    if (!handlersWhichAreRegisteredLaterInTheAppLifecyle.includes(response.handler)) {
      console.log('receiveMessageRenderer.response:', response);
    }
    const foundHandler = registeredMessageHandlers.find(obj => obj.registeredHandlerTypes.includes(response.handler));
    if (foundHandler) {
      foundHandler.handler(response);
    } else if (!handlersWhichAreRegisteredLaterInTheAppLifecyle.includes(response.handler)) {
      console.error(`No handler found on receiveMessageRenderer for ${response.handler}`);
      // console.log('registered handlers:', registeredHandlers);
      ipcRenderer.send('sendMessageMain', {
        handler: 'rendererLog',
        args: {
          msg: `No handler found on receiveMessage renderer for ${response.handler}`,
        },
      });
    }
  }
});

// preload script cannot have types defined so I am not using IBridgeAPIInterface
// even though I have defined it in typedefs/preload.d.ts
const API: IBridgeAPIInterface = {
  triciConfig: triciConfig,
  env: node_env,
  platform: platform,
  appPath,
  query: (query: any) => {
    ipcRenderer.send('queryRepo', query);
  },
  registerQueryResultHandler: (handler: Function, handlerType: string) => {
    console.log('registeredQueryHandlers:', registeredQueryResultHandlers);
    if (!registeredQueryResultHandlers.some(obj => obj.handlerType === handlerType)) {
      // console.log("Registering handler:", handlerType);
      registeredQueryResultHandlers.push({ handler, handlerType });
      // console.log("registeredQueryResultHandlers:", registeredQueryResultHandlers);
    } else {
      console.error(`handler already registered for queryResult type: ${handlerType}`);
    }
  },
  sendMessage: (msg: any) => {
    ipcRenderer.send('messageFromRenderer', msg);
  },
  registerReceiveHandlers: (componentId: string, handler: Function, registeredHandlerTypes: string[]) => {
    if (!registeredMessageHandlers.some(obj => obj.componentId === componentId)) {
      registeredMessageHandlers.push({ componentId, handler, registeredHandlerTypes });
      console.log('receive registered handler for componentId:', componentId);
    } else {
      console.log('handler already registered for ComponentId:', componentId);
    }
  },
  deregisterReceiveHandlers: (componentId: string) => {
    registeredMessageHandlers = registeredMessageHandlers.filter(obj => obj.componentId !== componentId); // eslint-disable-line  no-param-reassign
  },
  getAllDisplays: () => {
    const displays = ipcRenderer.sendSync('getAllDisplays', {});
    return displays;
  },
  getInitValues: () => initValues,
};

console.log('API:', API);

contextBridge.exposeInMainWorld('bridgeApi', API);
