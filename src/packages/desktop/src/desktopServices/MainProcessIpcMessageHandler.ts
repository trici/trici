/**
 * This service is responsible for handling all ipc messages from the renderer process.
 *
 */
import { ipcMain } from 'electron';
import { IMainProcessDataAccessService } from './MainProcessDataAccessService';
import { Logger, IConsoleLogger } from '@trici/logger';
import { MainProcessQueryResult } from '../typedefs/MainProcessQueryResult';
import { IAppJsonStorageService } from './AppJsonStorageService';
import { screen } from 'electron';
import { dispatch } from './ActionDispatcher';
import { IMessageFromMain, IMessageFromRenderer } from '../typedefs/preload';

export interface IMainProcessIpcMessageHandlerService {
  initialize(): void;
}

const successResponseForVoidFunctions: IMessageFromMain = { success: true, handler: '', data: {}, initValue: false };
export class MainProcessIpcMessageHandlerService implements IMainProcessIpcMessageHandlerService {
  private logger: Logger | IConsoleLogger;
  private dataAccessService: IMainProcessDataAccessService;
  private appJsonStorageService: IAppJsonStorageService;
  private initialized: boolean = false;

  constructor(
    logger: Logger | IConsoleLogger,
    dataAccessService: IMainProcessDataAccessService,
    appJsonStorageService: IAppJsonStorageService,
  ) {
    this.logger = logger;
    this.dataAccessService = dataAccessService;
    this.appJsonStorageService = appJsonStorageService;
  }

  private _registerQueryHandlers(): void {
    ipcMain.on('queryRepo', async (event, params) => {
      console.log('MainProcessIpcQueryHandlerService._registerQueryHandlers', params);
      let result: MainProcessQueryResult = { success: false, handler: '', data: null };
      switch (params.handler) {
        case 'getUserPreferences':
          try {
            // get the lastSavedEntityIds for the userPreferences and pass it.
            const lastSavedEntityIds = await this.appJsonStorageService.getLastSavedEntityIds();
            const userPreferences = await this.dataAccessService.getUserPreferences(
              lastSavedEntityIds.userPreferencesId,
            );
            result = { success: true, handler: 'getUserPreferences-Success', data: userPreferences.toJS() };
          } catch (error) {
            result = { success: false, handler: 'getUserPreferences-Error', data: error };
          }
          break;
        case 'saveUserPreferences':
          const { userPreferences, idOfDocToDelete } = params.args;
          const savedUserPreferences = await this.dataAccessService.saveUserPreferences(
            userPreferences,
            idOfDocToDelete,
          );
          let lastSavedEntityIds = await this.appJsonStorageService.getLastSavedEntityIds();
          lastSavedEntityIds = lastSavedEntityIds.set('userPreferencesId', savedUserPreferences._id);
          await this.appJsonStorageService.setLastSavedEntityIds(lastSavedEntityIds);
          result = { success: true, handler: 'saveUserPreferences-Success', data: savedUserPreferences.toJS() };
          break;
        default:
          break;
      }
      event.reply('queryRepoResult', result);
    });
  }

  /**
   * This for all synchronous ipcMain.on calls.
   */
  private _registerIpcMethodHandlers(): void {
    ipcMain.on('getAllDisplays', async (event, params) => {
      const displays = screen.getAllDisplays();
      event.returnValue = displays;
    });
  }

  private async _handleMessage(msg: IMessageFromRenderer): Promise<IMessageFromMain> {
    let response: IMessageFromMain = {
      success: false,
      handler: '',
      data: null,
      initValue: false,
    };
    switch (msg.handler) {
      case 'hideMainWindow': {
        dispatch({ type: 'HIDE_TRICI' });
        response = successResponseForVoidFunctions;
        break;
      }
      case 'openSystemPreferencesAndCloseAlert': {
        dispatch({ type: 'OPEN_SYSTEM_PREFERENCES' });
        dispatch({ type: 'CLOSE_ALERT_WINDOW' });
        response = successResponseForVoidFunctions;
        break;
      }
      case 'openSettingsAndCloseAlert': {
        dispatch({ type: 'OPEN_SETTINGS_WINDOW', args: msg.args });
        dispatch({ type: 'CLOSE_ALERT_WINDOW' });
        response = successResponseForVoidFunctions;
        break;
      }
    }

    return response;
  }
  /**
   * Handle messages from the renderer process.
   */
  private _registerMessageHandlers(): void {
    ipcMain.on('messageFromRenderer', async (event, msg) => {
      try {
        const response = await this._handleMessage(msg);
        if (response.success && response.handler !== '') {
          event.sender.send('messageFromMain', response);
        } else if (!response.success) {
          logger.error('response.success is false:', response);
        }
      } catch (err: any) {
        const errorString = `errorMessage: ${err.toString()},
          params: ${JSON.stringify(msg)}
          StackTrace: ${err.stack}`;
        logger.error(errorString);
      }
    });
  }

  public initialize(): void {
    if (!this.initialized) {
      this._registerQueryHandlers();
      this._registerIpcMethodHandlers();
      this._registerMessageHandlers();
      this.initialized = true;
    }
  }
}
