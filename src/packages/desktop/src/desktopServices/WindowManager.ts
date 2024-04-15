import { IConsoleLogger, Logger } from '@trici/logger';
import { app, screen, BrowserWindow } from 'electron';
import { IActionDispatcher } from './ActionDispatcher';
import contextMenu from 'electron-context-menu';
import { TriciAction } from '../typedefs/TriciAction';
import { SettingsKey } from '../app/windows/settings/typedefs/SettingsWindowTypes';
import { openSystemPreferences } from 'mac-screen-capture-permissions';
import path from 'path';

export type WindowName = 'settings' | 'main' | 'alert' | 'onboarding';

export interface IWindowManager {
  registerActionHandlers(): void;
  getWindow(windowName: WindowName): BrowserWindow | null;
  // getMainWindow(): BrowserWindow | null;
}

export class WindowManager implements IWindowManager {
  logger: Logger | IConsoleLogger;
  settingsWindow: BrowserWindow | null;
  alertWindow: BrowserWindow | null;
  mainWindow: BrowserWindow | null;
  onboardingWindow: BrowserWindow | null;
  eventViewerWindow: BrowserWindow | null;
  actionHandlersRegistered: boolean = false;
  actionDispatcher: IActionDispatcher<TriciAction>;
  preloadScriptPath: string;

  constructor(logger: Logger | IConsoleLogger, actionDispatcher: IActionDispatcher<TriciAction>) {
    this.logger = logger;
    this.settingsWindow = null;
    this.mainWindow = null;
    this.alertWindow = null;
    this.eventViewerWindow = null;
    this.onboardingWindow = null;
    this.actionDispatcher = actionDispatcher;
    this.preloadScriptPath = path.join(app.getAppPath(), 'dist', 'preload.js');
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
          case 'SHOW_HIDE_TRICI':
            console.log('Show/Hide Trici');
            break;
          case 'OPEN_ONBOARDING_WINDOW':
            console.log('Open Onboarding Window');
            this._openOnboardingWindow();
            break;
          case 'CLOSE_ONBOARDING_WINDOW':
            console.log('Close Onboarding Window');
            this._closeOnboardingWindow();
            break;
          case 'ONBOARDING_FINISHED':
            console.log('Onboarding Finished. Closing Onboarding Window');
            this._closeOnboardingWindow();
            break;
          case 'OPEN_EVENT_VIEWER_WINDOW':
            console.log('Open Event Viewer Window');
            this._openEventViewerWindow();
            break;
          default:
            break;
        }
      });
      this.actionHandlersRegistered = true;
    }
  }
  private _openEventViewerWindow() {
    if (this.eventViewerWindow) {
      this.eventViewerWindow.show();
      return;
    }
    const preloadScriptPath = this.preloadScriptPath;
    const { x, y } = this._getWindowCoordinates(1600, 1200);
    this.eventViewerWindow = new BrowserWindow({
      width: 1600,
      height: 1200,
      x,
      y,
      webPreferences: {
        nodeIntegration: false,
        preload: preloadScriptPath,
        contextIsolation: true,
      },
      maximizable: true,
      minimizable: true,
    });

    this.eventViewerWindow.loadFile(path.join(app.getAppPath(), 'dist', 'index.html'), {
      query: { type: 'eventviewer' },
    });

    contextMenu({
      window: this.eventViewerWindow,
      showInspectElement: true,
    });

    this.eventViewerWindow.on('closed', () => {
      this.eventViewerWindow = null;
    });
  }

  private _closeOnboardingWindow() {
    if (this.onboardingWindow) {
      this.onboardingWindow.close();
      this.onboardingWindow = null;
    }
  }

  /**
   *  Checks whether multiple diplays are available and if so then return x and y coordinates for the window being created.
   *  The x and y coordinates are calculated based on the display size and the window size.
   *  The window is placed in the center of the display.
   *  @returns {x: number, y: number}
   */
  private _getWindowCoordinates(windowWidth: number, windowHeight: number): { x: number; y: number } {
    const displays = screen.getAllDisplays();
    // choose the display that the user has selected for recording.
    // else choose the display that has the largest area.
    let displayToPlaceWindow;
    if (displays.length > 1) {
      // TODO: get the display that the user has selected for recording.
      displayToPlaceWindow = displays.reduce((prev, current) => {
        return prev.size.width * prev.size.height > current.size.width * current.size.height ? prev : current;
      });
    } else {
      displayToPlaceWindow = displays[0];
    }
    const x = displayToPlaceWindow.bounds.x + Math.floor((displayToPlaceWindow.size.width - windowWidth) / 2);
    const y = displayToPlaceWindow.bounds.y + Math.floor((displayToPlaceWindow.size.height - windowHeight) / 2);
    return { x, y };
  }

  private _openOnboardingWindow(): void {
    if (this.onboardingWindow) {
      this.onboardingWindow.show();
      return;
    }
    const preloadScriptPath = this.preloadScriptPath;
    const { x, y } = this._getWindowCoordinates(800, 600);
    this.onboardingWindow = new BrowserWindow({
      width: 800,
      height: 600,
      x,
      y,
      maximizable: false,
      minimizable: false,
      titleBarStyle: 'hidden',
      // alwaysOnTop: false,
      webPreferences: {
        nodeIntegration: false,
        preload: preloadScriptPath,
        contextIsolation: true,
      },
    });
    this.onboardingWindow.loadFile(path.join(app.getAppPath(), 'dist', 'index.html'), {
      query: { type: 'onboarding' },
    });
    this.onboardingWindow.webContents.send('messageFromMain', {
      success: true,
      handler: 'onboardingStateInit',
      data: { onboardingState: global.onboardingState.toJS() },
      initValue: true,
    });
    contextMenu({
      window: this.onboardingWindow,
      showInspectElement: true,
    });
    this.onboardingWindow.on('closed', () => {
      const onboardingState = global.onboardingState;
      this.onboardingWindow = null;
      if (!onboardingState.onboardingFinished) {
        console.log('Closing the app as onboarding is not finished');
        app.quit();
      } else {
        // restart the app as the onboarding is finished.
        app.relaunch();
        app.exit(0);
      }
    });
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
    if (this.onboardingWindow) {
      this.onboardingWindow.reload();
    }
    if (this.eventViewerWindow) {
      this.eventViewerWindow.reload();
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
    const { x, y } = this._getWindowCoordinates(800, 600);
    this.alertWindow = new BrowserWindow({
      width: 800,
      height: 600,
      x,
      y,
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
    this.alertWindow.loadFile(path.join(app.getAppPath(), 'dist', 'index.html'), { query: { type: 'alert' } });
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
    const { x, y } = this._getWindowCoordinates(800, 600);
    this.settingsWindow = new BrowserWindow({
      width: 800,
      height: 600,
      x,
      y,
      webPreferences: {
        nodeIntegration: false,
        preload: preloadScriptPath,
        contextIsolation: true,
      },
    });
    this.settingsWindow.loadFile(path.join(app.getAppPath(), 'dist', 'index.html'), { query: { type: 'settings' } });
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

  public getWindow(windowName: WindowName): BrowserWindow | null {
    switch (windowName) {
      case 'settings':
        return this.settingsWindow;
      case 'main':
        return this.mainWindow;
      case 'alert':
        return this.alertWindow;
      case 'onboarding':
        return this.onboardingWindow;
      default:
        return null;
    }
  }
}
