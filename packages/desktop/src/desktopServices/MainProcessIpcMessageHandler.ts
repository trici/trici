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

export interface IMainProcessIpcMessageHandlerService {
  initialize(): void;
}

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

  private _registerIpcMethodHandlers(): void {
    ipcMain.on('getAllDisplays', async (event, params) => {
      const displays = screen.getAllDisplays();
      event.returnValue = displays;
    });
  }

  public initialize(): void {
    if (!this.initialized) {
      this._registerQueryHandlers();
      this._registerIpcMethodHandlers();
      this.initialized = true;
    }
  }
}
