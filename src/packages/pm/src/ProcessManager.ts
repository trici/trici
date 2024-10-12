import ipc from 'node-ipc';
import config from '@trici/config';
import type { Logger } from '@trici/logger';
import EventEmitter from 'events';
import { CLIMessageType, IPCServerEvents } from '@trici/models';
import { clearNodeIpcServerSocket } from '@trici/utils';

export interface IProcessManager {
  registerPrimaryProcess(processID: number): void;
  isPrimaryProcessRegistered(): boolean;
  killPrimaryProcess(): void;
  updateLogger(logger: Logger): void;
  sendCliMessageResponse(data: any, socket: any): void;
  on(event: CLIMessageType, listener: (data: any, socket: any) => void): void;
}

/**
 *  class
 * @class ProcessManager
 * @implements {IProcessManager}
 * @description - The ProcessManager class is responsible for ensuring that only one instance of the primary process is running at any given time.
 * It also provides a mechanism for the primary process to communicate with the secondary processes using IPC.
 */
export class ProcessManager implements IProcessManager {
  private _registeredPrimaryProcessId: number;
  private _logger: any;
  private _eventEmitter: EventEmitter;

  constructor(logger: Logger) {
    // ...
    this._registeredPrimaryProcessId = 0;
    this._logger = logger;
    this._eventEmitter = new EventEmitter();
  }

  private _getIpcConfig(): any {
    // ...
    return {
      id: config.ipcConfigId,
      retry: 500,
      maxRetries: 10,
      appspace: config.ipcConfigAppSpace,
      socketRoot: config.ipcConfigSocketRoot,
      logger: this._logger.info.bind(this._logger),
      delimiter: config.ipcConfigDelimiter,
    };
  }

  cliMessageHandler = (data: { type: CLIMessageType; data: any }, socket: any) => {
    const result = { success: false, message: '' };
    switch (data.type) {
      case CLIMessageType.START_FOCUS_SESSION:
        this._eventEmitter.emit(CLIMessageType.START_FOCUS_SESSION, data.data, socket);
        result.success = true;
        break;
      case CLIMessageType.STOP_FOCUS_SESSION:
        this._eventEmitter.emit(CLIMessageType.STOP_FOCUS_SESSION, data.data, socket);
        result.success = true;
        break;
      default:
        result.success = false;
    }
    return result;
  };

  /**
   * Updates the logger with the passed value.
   * @description - This is used to update the logger when the logger is updated in the LoggingService.
   * @param logger - The updated logger after changing the defaultMeta
   */
  updateLogger(logger: Logger): void {
    this._logger = logger;
  }

  /**
   * Register the primary process
   * @param processID - The process ID of the primary process
   * @throws {Error} - If the primary process is already registered
   * @throws {Error} - If there is an error registering the primary process
   * @returns {void}
   * @memberof ProcessManager
   * @example
   * processManager.registerPrimaryProcess(process.pid);
   * // => void
   */
  registerPrimaryProcess(processID: number): void {
    // ...
    if (this.isPrimaryProcessRegistered()) {
      throw new Error('Primary process already registered');
    }
    // Clear the socketRoot directory
    clearNodeIpcServerSocket(config.ipcConfigSocketRoot + config.ipcConfigAppSpace + config.ipcConfigId);
    ipc.config = this._getIpcConfig();
    try {
      ipc.serve(() => {
        ipc.server.on(IPCServerEvents.CONNECT, socket => {
          console.log('server connected');
          ipc.server.emit(socket, 'Primary process connected');
        });
        ipc.server.on(IPCServerEvents.PING, (data: any, socket: any) => {
          console.log('server got a ping');
          ipc.log('got a message from '.concat(data.id));
          ipc.server.emit(socket, IPCServerEvents.PING, { type: 'pong', id: ipc.config.id });
        });
        ipc.server.on(IPCServerEvents.CLI_MESSAGE, (data: any, socket: any) => {
          const result = this.cliMessageHandler(data, socket);
          console.log('serverCliMessageHandler result: ' + JSON.stringify(result));
          if (!result.success) {
            result.message = 'Command not recognised or not implemented';
            ipc.server.emit(socket, IPCServerEvents.CLI_MESSAGE, result);
          }
        });
        ipc.server.on(IPCServerEvents.DISCONNECT, socket => {
          ipc.log('client '.concat(String(socket)).concat(' has disconnected!'));
        });
      });
      ipc.server.start();
      this._registeredPrimaryProcessId = processID;
    } catch (err) {
      console.log('Error registering primary process: ' + err);
      console.log(err);
      this._registeredPrimaryProcessId = 0;
      // throw new Error("Error registering primary process");
    }
  }

  on(event: CLIMessageType, listener: (...args: any[]) => void): void {
    console.log('processManager.on: ' + event);
    this._eventEmitter.on(event, listener);
  }

  sendCliMessageResponse(data: any, socket: any): void {
    ipc.server.emit(socket, IPCServerEvents.CLI_MESSAGE, data);
    console.log('sendCliMessageResponse: ' + JSON.stringify(data));
  }

  isPrimaryProcessRegistered(): boolean {
    // ...
    return this._registeredPrimaryProcessId > 0;
  }

  killPrimaryProcess(): void {
    // ...
    if (!this.isPrimaryProcessRegistered()) {
      throw new Error('Primary process not registered');
    }
    ipc.server.stop();
    this._registeredPrimaryProcessId = 0;
  }
}
