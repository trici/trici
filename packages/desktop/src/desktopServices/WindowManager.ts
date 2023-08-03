import { IConsoleLogger, Logger } from '@trici/logger';
import { app, BrowserWindow } from 'electron';
import { IActionDispatcher } from './ActionDispatcher';
import contextMenu from 'electron-context-menu';
import { TriciAction } from '../typedefs/TriciAction';
import { SettingsKey } from '../app/windows/settings/typedefs/SettingsWindowTypes';
import { openSystemPreferences } from 'mac-screen-capture-permissions';

export interface IWindowManager {
  registerActionHandlers(): void;
  // getMainWindow(): BrowserWindow | null;
}

export class WindowManager implements IWindowManager {
  logger: Logger | IConsoleLogger;
  settingsWindow: BrowserWindow | null;
  alertWindow: BrowserWindow | null;
  mainWindow: BrowserWindow | null;
  actionHandlersRegistered: boolean = false;
  actionDispatcher: IActionDispatcher<TriciAction>;
  preloadScriptPath: string;

  constructor(logger: Logger | IConsoleLogger, actionDispatcher: IActionDispatcher<TriciAction>) {
    this.logger = logger;
    this.settingsWindow = null;
    this.mainWindow = null;
    this.alertWindow = null;
    this.actionDispatcher = actionDispatcher;
    this.preloadScriptPath = `${app.getAppPath()}/src/preload/preload.js`;
  }

  registerActionHandlers(): void {
    if (!this.actionHandlersRegistered) {
      this.actionDispatcher.register((action: TriciAction) => {
        switch (action.type) {
          case 'OPEN_SETTINGS_WINDOW':
            this._createAndShowSettingsWindow(action.args.section);
            break;
          case 'RELOAD_OPEN_WINDOWS':
            this._reloadOpenWindows();
            break;
          case 'SHOW_ALERT_WINDOW':
            this._createAndShowAlertWindow(action.args.alertType, action.args.quitAppOnClose);
            break;
          case 'OPEN_SYSTEM_PREFERENCES':
            this._openSystemPreferences();
            break;
          case 'CLOSE_ALERT_WINDOW':
            this._closeAlertWindow();
            break;
          default:
            break;
        }
      });
      this.actionHandlersRegistered = true;
    }
  }

  private _openSystemPreferences(): void {
    if (process.platform === 'darwin') {
      openSystemPreferences();
    }
  }

  private _reloadOpenWindows(): void {
    if (this.settingsWindow) {
      this.settingsWindow.reload();
    }
    if (this.mainWindow) {
      this.mainWindow.reload();
    }
    if (this.alertWindow) {
      this.alertWindow.reload();
    }
  }

  private _showMainWindow(): void {
    throw new Error('Method not implemented.');
  }

  private _hideMainWindow(): void {
    throw new Error('Method not implemented.');
  }

  private _createAndShowAlertWindow(alertType: string, quitAppOnClose: boolean): void {
    // throw new Error('Method not implemented.');
    if (this.alertWindow) {
      this.alertWindow.show();
      this.alertWindow.webContents.send('messageFromMain', {
        success: true,
        handler: 'showAlertType',
        data: { alertType },
        initValue: true,
      });
      return;
    }
    const preloadScriptPath = this.preloadScriptPath;
    this.alertWindow = new BrowserWindow({
      width: 800,
      height: 600,
      // frame: false,
      titleBarStyle: 'hidden',
      alwaysOnTop: true,
      resizable: false,
      webPreferences: {
        nodeIntegration: false,
        preload: preloadScriptPath,
        contextIsolation: true,
      },
    });
    if (quitAppOnClose) {
      this.alertWindow.on('close', () => {
        console.log('Closing the app as quitAppOnClose is true');
        app.quit();
      });
    } else {
      this.alertWindow.on('close', () => {
        this.alertWindow = null;
      });
    }
    contextMenu({
      window: this.alertWindow,
      showInspectElement: true,
    });
    this.alertWindow.loadFile(`src/alert.html`);
    this.alertWindow.webContents.send('messageFromMain', {
      success: true,
      handler: 'showAlertType',
      data: { alertType },
      initValue: true,
    });
  }

  private _closeAlertWindow(): void {
    if (this.alertWindow) {
      this.alertWindow.close();
      this.alertWindow = null;
    }
  }

  private _createAndShowSettingsWindow(settingKey: SettingsKey): void {
    if (this.settingsWindow) {
      this.settingsWindow.show();
      this.settingsWindow.webContents.send('messageFromMain', {
        success: true,
        handler: 'openSettingsSection',
        data: { section: settingKey },
        initValue: true,
      });
      return;
    }
    const preloadScriptPath = this.preloadScriptPath;
    this.settingsWindow = new BrowserWindow({
      width: 800,
      height: 600,
      webPreferences: {
        nodeIntegration: false,
        preload: preloadScriptPath,
        contextIsolation: true,
      },
    });
    this.settingsWindow.loadFile(`src/settings.html`);
    contextMenu({
      window: this.settingsWindow,
      showInspectElement: true,
    });

    this.settingsWindow.webContents.send('messageFromMain', {
      success: true,
      handler: 'openSettingsSection',
      data: { section: settingKey },
      initValue: true,
    });
    // this.settingsWindow.webContents.openDevTools();
    this.settingsWindow.on('closed', () => {
      this.settingsWindow = null;
    });
  }
}
