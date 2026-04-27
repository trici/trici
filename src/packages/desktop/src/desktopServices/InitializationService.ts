import { app } from 'electron';
import config from '@trici/config';
import { ProcessManagerSingleton, IProcessManager } from '@trici/pm';
import { UserActivityStateMachineSingleton, IUserActivityStateMachine } from '@trici/activmon';
import TrayService, { ITrayService } from './TrayService';
import LoggingService from '@trici/logger';
import AppJsonStorageService, { IAppJsonStorageService } from './AppJsonStorageService';
import type { Logger, IConsoleLogger } from '@trici/logger';
import { AppService, IAppService } from './AppService';
import { WindowManager } from './WindowManager';
import { CliMessageHandlerService } from './CliMessageHandlerService';
import { FocusSessionService } from './FocusSessionService';
import {
  FocusSessionRepository,
  IFocusSessionRepository,
  IUsedApplicationRepository,
  UsedApplicationRepository,
} from '@trici/dal';
import { AppEventRepository, IAppEventRepository } from '@trici/dal';
import { SqliteDbManager, ISqliteDbManager } from '@trici/dal';
import { AppObserverService } from '@trici/app-observer';
import { UserActivityMonitorService } from './UserActivityMonitorService';
import { TriciRecorder } from '@trici/recorder';
import { PluginManager } from './PluginManager';
import { AppEventEmitter } from './AppEventEmitter';
import { ScreenRecordingPlugin } from '../plugins/ScreenRecordingPlugin';
import { SessionEndDataProcessingPlugin } from '../plugins/SessionEndDataProcessingPlugin';
import actionDispatcher, { dispatch } from './ActionDispatcher';
import { IUsedApplication } from '@trici/models';
import { GlobalShortcutService } from './GlobalShortcutService';
import { MainProcessDataAccessService } from './MainProcessDataAccessService';
import { MainProcessIpcMessageHandlerService } from './MainProcessIpcMessageHandler';
import { PermissionsService } from './PermissionsService';
import UsedApplicationsService from './UsedApplicationsService';
import { MainProcessIpcMessageSender } from './MainProcessIpcMessageSender';
import { UpdateService } from './UpdateService';
import path from 'path';
import sqlite3 from 'sqlite3';
import knexfile from '../../knexfile';
import { VoiceRecordingPlugin } from '../plugins/VoiceRecordingPlugin';

let logger: Logger;
let appJsonStorageService: IAppJsonStorageService;
let trayService: TrayService;
let processManager: IProcessManager;
let appService: IAppService;
let permissionsService: PermissionsService;

let dbManager: ISqliteDbManager;
let sqliteDb: sqlite3.Database;
let eventRepo: IAppEventRepository;
let focusSessionRepository: IFocusSessionRepository;
let usedApplicationRepository: IUsedApplicationRepository;
let cliMessageHandlerService: CliMessageHandlerService;
let focusSessionService: FocusSessionService;

LoggingService.on('defaultMetaChanged', () => {
  logger = LoggingService.getLogger();
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
function regiserCorePlugins(
  pluginManager: PluginManager,
  recorder: TriciRecorder,
  appEventRepository: IAppEventRepository,
  getLogger: () => Logger | IConsoleLogger,
  actionDispatcher: any,
  windowManager: WindowManager,
) {
  const screenRecordingPlugin = new ScreenRecordingPlugin(recorder);
  pluginManager.register(screenRecordingPlugin, 10);

  const sessionEndDataProcessingPlugin = new SessionEndDataProcessingPlugin(appEventRepository, getLogger);
  pluginManager.register(sessionEndDataProcessingPlugin, 100);

  const voiceRecordingPlugin = new VoiceRecordingPlugin(actionDispatcher, windowManager, recorder);
  pluginManager.register(voiceRecordingPlugin, 20);
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

      // Create a bound logger getter function
      const getLoggerFn = () => LoggingService.getLogger();

      const onboardingState = await appJsonStorageService.getOnboardingState();
      global.onboardingState = onboardingState;

      logger.info('Initialize the TrayService');
      const userActivityStateMachine = UserActivityStateMachineSingleton.getInstance(getLoggerFn);
      trayService = new TrayService(actionDispatcher, appEventEmitter, userActivityStateMachine);
      trayService.initService();

      processManager = ProcessManagerSingleton.getInstance(getLoggerFn);
      const windowManager = new WindowManager(getLoggerFn, actionDispatcher);
      windowManager.registerActionHandlers();

      const mainProcessIpcMessageSender = new MainProcessIpcMessageSender(windowManager);
      const appObserverLogsDirectory = app.getPath('logs');
      // Instantiate the AppObserver service. It is started inside UserActivityMonitorService
      const appObserverService = new AppObserverService(getLoggerFn, app.getAppPath(), appObserverLogsDirectory);

      permissionsService = new PermissionsService(
        appJsonStorageService,
        actionDispatcher,
        appEventEmitter,
        mainProcessIpcMessageSender,
      );
      permissionsService.initService();

      appService = new AppService(processManager, trayService, appJsonStorageService, permissionsService);
      await appService.checkUserDataDirectory();

      //Set up the sqlite database
      console.log('knexfile:', knexfile);
      dbManager = new SqliteDbManager(getLoggerFn);
      await dbManager.init(global.userDataDirectoryCheckResult.dataDir.path, knexfile);

      sqliteDb = dbManager.getDb();

      eventRepo = new AppEventRepository(sqliteDb, getLoggerFn);
      usedApplicationRepository = new UsedApplicationRepository(sqliteDb, getLoggerFn);
      focusSessionRepository = new FocusSessionRepository(sqliteDb, getLoggerFn);

      // Initialize the AppEventEmitter
      appEventEmitter.initializeRepo(eventRepo);

      const userPreferences = await appJsonStorageService.getUserPreferences();
      global.userPreferences = userPreferences;

      // Now start the app
      await appService.start();

      const triciApp = global.triciApp;

      const usedApplicationsService = new UsedApplicationsService(
        appObserverService,
        appJsonStorageService,
        usedApplicationRepository,
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
      const recorderPath = isRunningInAsar
        ? path.join(app.getAppPath(), '..', 'app.asar.unpacked', 'bin', 'Recorder')
        : config.builtFor === 'dev'
          ? path.join(app.getAppPath(), 'bin', 'dev', 'Recorder')
          : path.join(app.getAppPath(), 'bin', 'Recorder');
      const triciRecorder = new TriciRecorder(ffmpegPath, getLoggerFn, recorderPath);

      // Initialize the infra to listen to queries from the renderer process
      const mainProcessDataAccessService = MainProcessDataAccessService.getInstance(
        appJsonStorageService,
        usedApplicationsService,
        eventRepo,
        appObserverService,
        focusSessionRepository,
        getLoggerFn,
      );
      const mainProcessIpcMessageHandlerService = new MainProcessIpcMessageHandlerService(
        getLoggerFn,
        mainProcessDataAccessService,
        appJsonStorageService,
      );

      mainProcessIpcMessageHandlerService.initialize();

      const pluginManager = PluginManager.getInstance(getLoggerFn, appEventEmitter);
      pluginManager.initialize();

      // Register core plugins
      regiserCorePlugins(pluginManager, triciRecorder, eventRepo, getLoggerFn, actionDispatcher, windowManager);

      if (!triciApp.hasCompletedOnboarding) {
        return;
      }

      // This should be called after the app is started
      const shortcutService = new GlobalShortcutService();
      shortcutService.initService();

      focusSessionService = new FocusSessionService(
        focusSessionRepository,
        appObserverService,
        appEventEmitter,
        actionDispatcher,
        getLoggerFn,
      );
      focusSessionService.initService();
      cliMessageHandlerService = new CliMessageHandlerService(processManager, focusSessionService);
      cliMessageHandlerService.registerCliMessageHandlers();

      // Start the UserActivityMonitor service
      const userActivityMonitorService = new UserActivityMonitorService(
        getLoggerFn,
        appObserverService,
        appJsonStorageService,
        appEventEmitter,
        actionDispatcher,
        usedApplicationsService,
        userActivityStateMachine,
        eventRepo,
      );
      userActivityMonitorService.initService();
      userActivityMonitorService.start();

      // Initialize the UpdateService
      try {
        const updateService = UpdateService.getInstance(logger);
        await updateService.initialize();
        await updateService.checkForUpdates();

        if (!updateService.isServerReachable()) {
          logger.warn('Update server is not reachable. App will continue without auto-updates.');
        }
      } catch (error) {
        logger.error('Failed to initialize update service:', error);
        // Continue app execution even if update service fails
      }

      // console.log('global.userDataDirectoryCheckResult: ', global.userDataDirectoryCheckResult);
      // console.log(global.userDataDirectoryCheckResult.dataDir.path);

      // Register
    } catch (error) {
      logger.error('Error while starting the app', error);
      app.quit();
    }
  },
};
