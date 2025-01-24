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
import { OnboardingState } from '@trici/models';
import { IUsedApplication } from '@trici/models';

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
        case 'getUsedApplications':
          try {
            const usedApplicationsResult = await this.dataAccessService.getUsedApplications();
            const usedApplications: Array<IUsedApplication> = [];
            usedApplicationsResult.forEach(app => {
              usedApplications.push(app.toJS());
            });
            console.log('usedApplications:', usedApplications);
            result = { success: true, handler: 'getUsedApplications-Success', data: usedApplications };
          } catch (error) {
            result = { success: false, handler: 'getUsedApplications-Error', data: error };
          }
          break;
        case 'getEvents':
          try {
            const { from, to, type } = params.args;
            const events = await this.dataAccessService.getTriciAppEvents(from, to, type, 20);
            result = { success: true, handler: 'getEvents-Success', data: events };
          } catch (error) {
            result = { success: false, handler: 'getEvents-Error', data: error };
          }
          break;
        case 'getFocusSessionsForDuration':
          try {
            const { from, to } = params.args;
            const focusSessions = await this.dataAccessService.getFocusSessionsForDuration(from, to);
            result = { success: true, handler: 'getFocusSessionsForDuration-Success', data: focusSessions };
          } catch (error) {
            result = { success: false, handler: 'getFocusSessionsForDuration-Error', data: error };
          }
          break;
        case 'getFocusSessionsPaginated':
          try {
            const { pageIndex, pageSize } = params.args;
            const focusSessionsResult = await this.dataAccessService.getFocusSessionsPaginated(pageIndex, pageSize);
            const focusSessions = focusSessionsResult.map(session => session.toJS());
            result = { success: true, handler: 'getFocusSessionsPaginated-Success', data: focusSessions };
          } catch (error) {
            result = { success: false, handler: 'getFocusSessionsPaginated-Error', data: error };
          }
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
      case 'askForScreenRecordingPermissions': {
        console.log("dispatching 'ASK_FOR_SCREEN_RECORDING_PERMISSIONS' action");
        dispatch({ type: 'ASK_FOR_SCREEN_RECORDING_PERMISSIONS' });
        response = successResponseForVoidFunctions;
        break;
      }
      case 'askForAccessibilityPermissions': {
        console.log("dispatching 'ASK_FOR_ACCESSIBILITY_PERMISSIONS' action");
        dispatch({ type: 'ASK_FOR_ACCESSIBILITY_PERMISSIONS' });
        response = successResponseForVoidFunctions;
        break;
      }
      // case 'openSystemPreferencesAndCloseAlert': {
      //   dispatch({ type: 'OPEN_SYSTEM_PREFERENCES' });
      //   dispatch({ type: 'CLOSE_ALERT_WINDOW' });
      //   response = successResponseForVoidFunctions;
      //   break;
      // }
      case 'openSettingsAndCloseAlert': {
        dispatch({ type: 'OPEN_SETTINGS_WINDOW', args: msg.args });
        dispatch({ type: 'CLOSE_ALERT_WINDOW' });
        response = successResponseForVoidFunctions;
        break;
      }
      case 'updateOnboardingState': {
        const updatedOnboardingStatePlainJSObj = msg.args.onboardingState;
        const prevOnboardingState = global.onboardingState;
        const updatedOnboardingState = new OnboardingState(updatedOnboardingStatePlainJSObj);
        await this.appJsonStorageService.setOnboardingState(updatedOnboardingState);
        global.onboardingState = updatedOnboardingState;
        if (!prevOnboardingState.onboardingFinished && updatedOnboardingState.onboardingFinished) {
          let triciApp = global.triciApp;
          triciApp = triciApp.set('hasCompletedOnboarding', true);
          await this.appJsonStorageService.setTriciAppObject(triciApp);
          global.triciApp = triciApp;
          dispatch({ type: 'ONBOARDING_FINISHED' });
        }
        response = {
          success: true,
          handler: 'onboardingStateUpdated',
          data: { onboardingState: global.onboardingState.toJS() },
          initValue: false,
        };
        break;
      }
      case 'updateUsedApplications': {
        const usedApplications = msg.args.usedApplications;
        dispatch({ type: 'UPDATE_USED_APPLICATIONS', args: { usedApplications: usedApplications } });
        response = successResponseForVoidFunctions;
        break;
      }
      case 'fetchInstalledApps': {
        console.log("MainProcessIpcMessageHandlerService._handleMessage: 'fetchInstalledApps'");
        try {
          const installedApps = await this.dataAccessService.getInstalledApplications();
          response = {
            success: true,
            handler: 'installedAppsReceived',
            data: { installedApps: installedApps },
            initValue: false,
          };
        } catch (error) {
          console.log('error in fetchInstalledApps', error);
          response = { success: false, handler: 'installedAppsReceived', data: error, initValue: false };
        }

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
        console.log(`handling messageFromRenderer:${JSON.stringify(msg)} `);
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
