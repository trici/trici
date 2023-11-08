import { app } from 'electron';
import LoggingService from '@trici/logger';
import { Constants, AlertWindowMessageType } from '@trici/models';
import type { ITrayService } from './TrayService';
import type { IAppJsonStorageService } from './AppJsonStorageService';
import type { IProcessManager } from '@trici/pm';
import { checkUserDataDirectory, userDataDirectoryCheckResult } from '@trici/utils';
import EventEmitter from 'events';
import { generateUUIDv5 } from '@trici/utils';
// import { hasScreenCapturePermission, hasPromptedForPermission } from 'mac-screen-capture-permissions';
import { dispatch } from './ActionDispatcher';
import { IPermissionsService } from './PermissionsService';

export interface IAppService {
  checkUserDataDirectory(): Promise<void>;
  start(): void;
}

export class AppService implements IAppService {
  #cleanupInitiated: boolean = false;
  #trayService: ITrayService;
  #appJsonStorageService: IAppJsonStorageService;
  permissionsService: IPermissionsService;
  #processManager: IProcessManager;
  #eventEmitter: EventEmitter;

  constructor(
    pm: IProcessManager,
    trayService: ITrayService,
    appJsonStorageService: IAppJsonStorageService,
    permissionsService: IPermissionsService,
  ) {
    this.#processManager = pm;
    this.#trayService = trayService;
    this.#appJsonStorageService = appJsonStorageService;
    this.permissionsService = permissionsService;
    this.#eventEmitter = new EventEmitter();
  }

  /**
   * Register App Lifecycle Event Handlers
   */
  #registerAppLifecycleEventHandlersOnStartup = () => {
    // Latest: We do nopt quit the app when all the windows are closed unless
    // the user specifically closes the application from the tray. So commenting all the below.
    // Also see https://www.electronjs.org/docs/api/app#event-window-all-closed
    // Hence we are using the will-quit
    // Quit when all windows are closed.
    app.on('window-all-closed', () => {
      // On OS X it is common for applications and their menu bar
      // to stay active until the user quits explicitly with Cmd + Q
      // in case it is still recording. see https://trello.com/c/wQyv5cdv
      logger.debug('app.on.window-all-closed');
    });

    app.on('activate', (event, hasVisibleWindows) => {
      // if (mainWindow && !mainWindow.isFocused()) {
      //   showMainWindow();
      // }
    });
    // app.on('before-quit', () => (willQuitApp = true));

    app.on('browser-window-blur', (evt, browserWindow) => {
      // if (browserWindow.getTitle().toLowerCase() === 'trici') {
      //   if (
      //     process.platform === 'darwin'
      //             && !browserWindow.webContents.isDevToolsOpened()
      //   ) {
      //     app.hide();
      //     if (mainWindow) {
      //       mainWindow.hide();
      //     }
      //   }
      // }
    });

    app.on('did-become-active', event => {
      // if (mainWindow && !mainWindow.isFocused()) {
      //   showMainWindow();
      // }
    });

    app.on('before-quit', async evt => {
      if (!this.#cleanupInitiated) {
        evt.preventDefault();
        console.log('app.on.before-quit');
        try {
          dispatch({ type: 'CLEANUP_BEFORE_SHUTDOWN' });
          this.#processManager.killPrimaryProcess();
          // kill any running child processes
          // TriciShell.stopRecordingKaalSession();
          // TriciShell.stopProxyServer();
          triciApp = triciApp.setCleanShutdownValues();
          await this.#appJsonStorageService.setTriciAppObject(triciApp);
          this.#cleanupInitiated = true;
          app.quit();
        } catch (e) {
          console.log('Error while setting the shut down values', e);
        }
      }
    });

    app.on('will-quit', evt => {
      console.log('app.on.will-quit');
      // TriciShell.stopRecordingKaalSession();
      // TriciShell.stopProxyServer();
      // globalShortcut.unregisterAll();
    });

    app.on('quit', (evt, exitCode) => {
      console.log('app.on.quit');
    });

    // screen.on('display-added', (evt, newDisplay) => {
    //   if (mainWindow) {
    //     mainWindow.webContents.send('receiveMessageRenderer', { success: true, handler: 'numberOfDisplaysChanged', data: {} });
    //   }
    // });
    // screen.on('display-removed', () => {
    //   if (mainWindow) {
    //     mainWindow.webContents.send('receiveMessageRenderer', { success: true, handler: 'numberOfDisplaysChanged', data: {} });
    //   }
    // });

    process.on('SIGINT', () => {
      logger.debug('Received SIGINT');
      app.quit();
    });
  };

  async checkUserDataDirectory(): Promise<void> {
    // Check user data directory for required subdirectories. Ex of userDataDirectory: /Users/username/Library/Application Support/Trici
    let userDataDirectoryCheckResult: userDataDirectoryCheckResult = await checkUserDataDirectory(
      app.getPath('userData'),
      'default',
    );
    global.userDataDirectoryCheckResult = userDataDirectoryCheckResult;
  }

  async start(): Promise<void> {
    try {
      this.#registerAppLifecycleEventHandlersOnStartup();

      // if (config.builtFor === 'dev' || config.builtFor === 'livedev') {
      //   const reactDevToolsPath = path.join(
      //     os.homedir(),
      //     '/Library/Application Support/Google/Chrome/Default/Extensions/fmkadmapgofadopljbjfkapdkoienihi/4.27.8_0'
      //   );
      //   await session.defaultSession.loadExtension(reactDevToolsPath);

      // }

      logger.info('AppService.startApp');
      if (process.platform === 'darwin') {
        app.commandLine.appendSwitch('--disable-accelerated-video-decode');
      }

      logger.info('Load the TriciApp object as a global');
      try {
        // Load the TriciApp object as a global
        let triciApp = await this.#appJsonStorageService.getTriciAppObject();
        if (triciApp.installationId === Constants.UNINITIALIZED_ID) {
          const installationId = await generateUUIDv5('triciInstallationId');
          triciApp = triciApp.setInstallationId(installationId);
          this.#appJsonStorageService.setTriciAppObject(triciApp);
          console.log('installationIdAfterGenerate: ', triciApp.installationId);
        }
        triciApp = triciApp.setLastLaunchTime();
        global.triciApp = triciApp;
        global.installationId = triciApp.installationId;
        // Change the logging configuration
        LoggingService.changeLoggerDefaultMeta({
          installationId: triciApp.installationId,
          appDetails: global.appDetails,
        });
      } catch (e) {
        logger.error('Error while loading the TriciApp object', e);
      }

      this.#processManager.registerPrimaryProcess(process.pid);

      if (!triciApp.hasCompletedOnboarding) {
        // Show the onboarding window
        dispatch({ type: 'OPEN_ONBOARDING_WINDOW' });
      } else {
        // Check for screen recording permissions on startup
        if (process.platform === 'darwin') {
          // openSystemPreferences();
          const screenCapturePermissionAtStartup = this.permissionsService.hasScreenRecordingPermissions();
          if (screenCapturePermissionAtStartup) {
            logger.info('Screen capture permission already granted');
            // Initialize the tray
            this.#trayService.createTrayInstance(logger);
          } else {
            console.log('User should not be seeing prompt for permission');
            dispatch({
              type: 'SHOW_ALERT_WINDOW',
              args: { alertType: AlertWindowMessageType.SCREEN_RECORDING_PERMISSION_REVOKED, quitAppOnClose: true },
            });
          }
        }
      }
    } catch (e) {
      console.log('Error while starting the app', e);
      logger.error('Error while starting the app', e);
      app.quit();
    }
  }
}
