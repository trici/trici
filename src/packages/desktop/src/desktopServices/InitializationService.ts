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
import actionDispatcher from './ActionDispatcher';
import { UserPreferences } from '@trici/models';
import { AskWhichScreenToRecordPlugin } from '../plugins/AskWhichScreenToRecordPlugin';
import { IWindowManager } from './WindowManager';
import { GlobalShortcutService } from './GlobalShortcutService';
import { MainProcessDataAccessService } from './MainProcessDataAccessService';
import { MainProcessIpcMessageHandlerService } from './MainProcessIpcMessageHandler';
import { ChangeTrayStatePlugin } from '../plugins/ChangeTrayStatePlugin';

let logger: Logger;
let appJsonStorageService: IAppJsonStorageService;
let trayService: ITrayService;
let processManager: IProcessManager;
let triciApp: IAppService;
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
  const changeTrayStatePlugin = new ChangeTrayStatePlugin(trayService);
  pluginManager.register(changeTrayStatePlugin);
}

export const InitializationService = {
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
      appJsonStorageService = AppJsonStorageService;
      trayService = TrayService;
      const shortcutService = new GlobalShortcutService();
      shortcutService.initService();
      processManager = ProcessManagerSingleton.getInstance(logger);
      const windowManager = new WindowManager(logger, actionDispatcher);
      windowManager.registerActionHandlers();

      triciApp = new AppService(processManager, trayService, appJsonStorageService);
      await triciApp.start();

      // console.log('global.userDataDirectoryCheckResult: ', global.userDataDirectoryCheckResult);
      // console.log(global.userDataDirectoryCheckResult.dataDir.path);

      // Initialize the CLI message handler
      repo = new TriciRepository(logger);
      repo.init(global.userDataDirectoryCheckResult.dataDir.path);
      const ffmpegPath = app.getAppPath() + '/bin/ffmpeg';
      const triciRecorder = new TriciRecorder(ffmpegPath, logger);
      const appEventEmitter = AppEventEmitter.getInstance();

      // Get the UserPreferences and set it in the global object
      const lastSavedEntityIds = await appJsonStorageService.getLastSavedEntityIds();
      const userPreferencesId = lastSavedEntityIds.userPreferencesId;
      const userPreferencesResult = await repo.get(userPreferencesId);
      const userPreferences = new UserPreferences(userPreferencesResult);
      global.userPreferences = userPreferences;

      focusSessionService = new FocusSessionService(repo, appEventEmitter, actionDispatcher);
      focusSessionService.registerActionHandlers();
      cliMessageHandlerService = new CliMessageHandlerService(processManager, focusSessionService);
      cliMessageHandlerService.registerCliMessageHandlers();

      // Initialize the infra to listen to queries from the renderer process
      const mainProcessDataAccessService = MainProcessDataAccessService.getInstance(repo);
      const mainProcessIpcMessageHandlerService = new MainProcessIpcMessageHandlerService(
        logger,
        mainProcessDataAccessService,
        appJsonStorageService,
      );

      mainProcessIpcMessageHandlerService.initialize();

      const pluginManager = PluginManager.getInstance(logger, appEventEmitter);
      pluginManager.initialize();
      regiserCorePlugins(pluginManager, triciRecorder, windowManager);

      // Instantiate the AppObserver service. It is started inside UserActivityMonitorService
      const appRoot = app.getAppPath();
      // console.log('appRoot: ', appRoot);
      const appObserverService = new AppObserverService(logger, app.getAppPath());

      // Start the UserActivityMonitor service
      const userActivityMonitorService = new UserActivityMonitorService(
        logger,
        IdleTimeService,
        appObserverService,
        repo,
        appJsonStorageService,
        appEventEmitter,
      );
      userActivityMonitorService.start();

      // Start the Idletime service
    } catch (error) {
      logger.error('Error while starting the app', error);
      app.quit();
    }
  },
};
