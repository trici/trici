import { app } from 'electron';
import config from '@trici/config';
import { ProcessManagerSingleton, IProcessManager } from '@trici/pm';
import TrayService, { ITrayService } from './TrayService';
import LoggingService from '@trici/logger';
import AppJsonStorageService, { IAppJsonStorageService } from './AppJsonStorageService';
import type { Logger } from '@trici/logger';
import { AppService, IAppService } from './AppService';
import { WindowManager } from './WindowManager';
import { CliMessageHandlerService } from './CliMessageHandlerService';
import { FocusSessionService } from './FocusSessionService';
import { TriciRepository } from '@trici/dal';
import IdleTimeService from './IdleTimeService';
import { AppObserverService } from '@trici/app-observer';
import { UserActivityMonitorService } from './UserActivityMonitorService';
import { TriciRecorder } from '@trici/recorder';
import { PluginManager } from './PluginManager';
import { AppEventEmitter } from './AppEventEmitter';
import { ScreenRecordingPlugin } from '../plugins/ScreenRecordingPlugin';
import actionDispatcher, { dispatch } from './ActionDispatcher';
import { UserPreferences } from '@trici/models';
import { AskWhichScreenToRecordPlugin } from '../plugins/AskWhichScreenToRecordPlugin';
import { IWindowManager } from './WindowManager';
import { GlobalShortcutService } from './GlobalShortcutService';
import { MainProcessDataAccessService } from './MainProcessDataAccessService';
import { MainProcessIpcMessageHandlerService } from './MainProcessIpcMessageHandler';
import { PermissionsService } from './PermissionsService';
import UsedApplicationsService from './UsedApplicationsService';
import { MainProcessIpcMessageSender } from './MainProcessIpcMessageSender';
import path from 'path';

let logger: Logger;
let appJsonStorageService: IAppJsonStorageService;
let trayService: TrayService;
let processManager: IProcessManager;
let appService: IAppService;
let permissionsService: PermissionsService;

let repo: TriciRepository;
let cliMessageHandlerService: CliMessageHandlerService;
let focusSessionService: FocusSessionService;

LoggingService.on('defaultMetaChanged', () => {
  logger = LoggingService.getLogger();
  processManager.updateLogger(logger);
  global.logger = logger;
});

/**
 * Initialize the logger
 */
function initializeLogger() {
  let dirPath = app.getPath('logs');
  console.log('Initializing logger with dirPath: ', dirPath);
  logger = LoggingService.init(dirPath, 'trici-%DATE%.log', {
    installationId: config.defaultInstallationId,
    appDetails: global.appDetails,
  });
}

/**
 * Load Core Plugins
 */
function regiserCorePlugins(pluginManager: PluginManager, recorder: TriciRecorder, windowManager: IWindowManager) {
  const screenRecordingPlugin = new ScreenRecordingPlugin(recorder);
  pluginManager.register(screenRecordingPlugin);
  const askWhichScreenToRecordPlugin = new AskWhichScreenToRecordPlugin(windowManager);
  pluginManager.register(askWhichScreenToRecordPlugin);
}

export interface IInitializationService {
  initLogger(): Logger;
  startApp(): Promise<void>;
}

export const InitializationService: IInitializationService = {
  // This is the main entry point for the desktop app.
  // It is called from main.ts
  // It is responsible for initializing all the services.
  initLogger(): Logger {
    global.appDetails = `${process.platform}-${config.builtFor}-${app.getVersion()}`;
    initializeLogger();
    global.logger = logger;
    return logger;
  },
  async startApp(): Promise<void> {
    try {
      logger.info('startingApp');
      appJsonStorageService = AppJsonStorageService;
      const appEventEmitter = AppEventEmitter.getInstance();

      logger.info('Load the TriciApp object as a global');
      // Get the UserPreferences and set it in the global object
      const lastSavedEntityIds = await appJsonStorageService.getLastSavedEntityIds();
      const userPreferencesId = lastSavedEntityIds.userPreferencesId;

      const onboardingState = await appJsonStorageService.getOnboardingState();
      global.onboardingState = onboardingState;

      logger.info('Initialize the TrayService');
      trayService = new TrayService(actionDispatcher, appEventEmitter);
      trayService.initService();

      processManager = ProcessManagerSingleton.getInstance(logger);
      const windowManager = new WindowManager(logger, actionDispatcher);
      windowManager.registerActionHandlers();

      const mainProcessIpcMessageSender = new MainProcessIpcMessageSender(windowManager);
      // Instantiate the AppObserver service. It is started inside UserActivityMonitorService
      const appObserverService = new AppObserverService(logger, app.getAppPath());

      permissionsService = new PermissionsService(
        appJsonStorageService,
        actionDispatcher,
        appEventEmitter,
        mainProcessIpcMessageSender,
      );
      permissionsService.initService();

      appService = new AppService(processManager, trayService, appJsonStorageService, permissionsService);
      await appService.checkUserDataDirectory();

      repo = new TriciRepository(logger);
      repo.init(global.userDataDirectoryCheckResult.dataDir.path);

      const userPreferencesResult = await repo.get(userPreferencesId);
      const userPreferences = new UserPreferences(userPreferencesResult);
      global.userPreferences = userPreferences;

      // Now start the app
      await appService.start();

      const triciApp = global.triciApp;

      const usedApplicationsService = new UsedApplicationsService(
        appObserverService,
        appJsonStorageService,
        repo,
        actionDispatcher,
      );
      usedApplicationsService.initService();

      if (!triciApp.hasCompletedOnboarding) {
        // start the app observer service
        console.log('isRunningInAsar: ', isRunningInAsar);
        appObserverService.start(isRunningInAsar);
      }

      const ffmpegPath = isRunningInAsar
        ? path.join(app.getAppPath(), '..', 'app.asar.unpacked', 'bin', 'ffmpeg')
        : app.getAppPath() + '/bin/ffmpeg';
      const triciRecorder = new TriciRecorder(ffmpegPath, logger);

      // Initialize the infra to listen to queries from the renderer process
      const mainProcessDataAccessService = MainProcessDataAccessService.getInstance(repo, appObserverService, logger);
      const mainProcessIpcMessageHandlerService = new MainProcessIpcMessageHandlerService(
        logger,
        mainProcessDataAccessService,
        appJsonStorageService,
      );

      mainProcessIpcMessageHandlerService.initialize();

      if (triciApp.hasCompletedOnboarding) {
        // This should be called after the app is started
        const shortcutService = new GlobalShortcutService();
        shortcutService.initService();

        focusSessionService = new FocusSessionService(repo, appEventEmitter, actionDispatcher);
        focusSessionService.initService();
        cliMessageHandlerService = new CliMessageHandlerService(processManager, focusSessionService);
        cliMessageHandlerService.registerCliMessageHandlers();

        const pluginManager = PluginManager.getInstance(logger, appEventEmitter);
        pluginManager.initialize();
        regiserCorePlugins(pluginManager, triciRecorder, windowManager);

        // Start the UserActivityMonitor service
        const userActivityMonitorService = new UserActivityMonitorService(
          logger,
          IdleTimeService,
          appObserverService,
          repo,
          appJsonStorageService,
          appEventEmitter,
          actionDispatcher,
          usedApplicationsService,
        );
        userActivityMonitorService.initService();
        userActivityMonitorService.start();
      } else {
      }

      // console.log('global.userDataDirectoryCheckResult: ', global.userDataDirectoryCheckResult);
      // console.log(global.userDataDirectoryCheckResult.dataDir.path);

      // Register

      // Start the Idletime service
    } catch (error) {
      logger.error('Error while starting the app', error);
      app.quit();
    }
  },
};
