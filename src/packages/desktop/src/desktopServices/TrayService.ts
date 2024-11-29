/**
 * @file Tray Service
 * @description The tray service creates an instance of the tray icon and provides methods for interacting with it.
 * @module @trici/desktop/TrayService
 * @requires electron
 *
 */

import { App, app, Menu, Tray } from 'electron';
import { SessionStartedBy, SessionStartedFrom, TrayState, TriciAppEvent } from '@trici/models';
import type { Logger } from '@trici/logger';
import { dispatch, IActionDispatcher } from './ActionDispatcher';
import { SettingsKey } from '../app/windows/settings/typedefs/SettingsWindowTypes';
import { TriciAction } from '../typedefs/TriciAction';
import { AppEventEmitter } from './AppEventEmitter';
import { ITriciDesktopService } from '../typedefs/ITriciDesktopService';
import { invariant } from '@trici/utils';
import { shortcutRegisteredResult, shortcutType } from './GlobalShortcutService';

/**
 */
export interface ITrayService {
  /**
   * Creates an instance of the tray icon.
   * @param logger
   */
  createTrayInstance(logger: Logger): void;

  /**
   * Adds accelerators to the tray icon context menu.
   * @param accelerators
   */
  addRegisteredShortcuts(registeredShortcuts: shortcutRegisteredResult[]): void;
  /**
   * Changes the state of the tray icon.
   * @param newState
   */
  changeTrayState(newState: TrayState): void;
  /**
   * Destroys the tray icon instance.
   */
  destroyTrayInstance(): void;
}

class TrayService implements ITriciDesktopService, ITrayService {
  tray?: Tray;
  trayState: TrayState;
  actionDispatcher: IActionDispatcher<TriciAction>;
  eventBus: AppEventEmitter;
  isServiceInitialized: boolean = false;
  receivedRegisteredShortcuts: shortcutRegisteredResult[] | undefined;

  constructor(actionDispatcher: IActionDispatcher<TriciAction>, eventBus: AppEventEmitter) {
    this.tray = undefined;
    this.trayState = TrayState.DEFAULT;
    this.actionDispatcher = actionDispatcher;
    this.eventBus = eventBus;
    this.isServiceInitialized = false;
    this.receivedRegisteredShortcuts = undefined;
  }

  private _getMenuTemplate(trayState: TrayState): any[] {
    let template: any[] = [];
    const shouldHaveAccelerator = this.receivedRegisteredShortcuts && this.receivedRegisteredShortcuts.length > 0;
    if (trayState === TrayState.DEFAULT) {
      template = [
        {
          label: 'Show/Hide Trici',
          accelerator: shouldHaveAccelerator
            ? this.receivedRegisteredShortcuts?.find(
                shresult => shresult.type === shortcutType.SHOW_HIDE_TRICI_SHORTCUT && shresult.isRegistered,
              )?.shortcut
            : undefined,
          click: () => {
            dispatch({ type: 'SHOW_HIDE_TRICI' });
          },
        },
        {
          label: 'Start Focus Session',
          accelerator: shouldHaveAccelerator
            ? this.receivedRegisteredShortcuts?.find(
                shresult => shresult.type === shortcutType.START_FOCUS_SESSION_SHORTCUT && shresult.isRegistered,
              )?.shortcut
            : undefined,
          click: () => {
            dispatch({
              type: 'START_FOCUS_SESSION',
              startedBy: SessionStartedBy.USER,
              startedFrom: SessionStartedFrom.TRAY,
            });
          },
        },
        {
          label: 'Settings',
          click: () => {
            dispatch({ type: 'OPEN_SETTINGS_WINDOW', args: { section: SettingsKey.APPLICATIONS } });
          },
        },
        {
          label: 'Event Viewer',
          click: () => {
            dispatch({ type: 'OPEN_EVENT_VIEWER_WINDOW' });
          },
        },
        {
          label: 'Quit',
          click: () => {
            app.quit();
          },
        },
      ];
    } else if (trayState === TrayState.SESSION_IN_PROGRESS) {
      template = [
        {
          label: 'Show/Hide Trici',
          accelerator: shouldHaveAccelerator
            ? this.receivedRegisteredShortcuts?.find(
                shresult => shresult.type === shortcutType.SHOW_HIDE_TRICI_SHORTCUT && shresult.isRegistered,
              )?.shortcut
            : undefined,
          click: () => {
            dispatch({ type: 'SHOW_HIDE_TRICI' });
          },
        },
        {
          label: 'Stop Session',
          accelerator: shouldHaveAccelerator
            ? this.receivedRegisteredShortcuts?.find(
                shresult => shresult.type === shortcutType.STOP_FOCUS_SESSION_SHORTCUT && shresult.isRegistered,
              )?.shortcut
            : undefined,
          click: () => {
            dispatch({ type: 'END_FOCUS_SESSION' });
          },
        },
      ];
    }
    return template;
  }
  private _getTrayContextMenu(): Menu {
    let template = this._getMenuTemplate(this.trayState);
    console.log('TrayService: Tray context menu template: ', template);
    return Menu.buildFromTemplate(template);
  }

  private registerActionHandlers(): void {
    this.actionDispatcher.register((action: TriciAction) => {
      switch (action.type) {
        case 'CLEANUP_BEFORE_SHUTDOWN':
          this.destroyTrayInstance();
          break;
        default:
          break;
      }
    });
  }

  private registerAppEventHandlers(): void {
    this.eventBus.on(TriciAppEvent.FOCUS_SESSION_STARTED, () => {
      console.log("TrayService: Received event 'FOCUS_SESSION_STARTED'");
      this.changeTrayState(TrayState.SESSION_IN_PROGRESS);
    });
    this.eventBus.on(TriciAppEvent.FOCUS_SESSION_ENDED, () => {
      console.log("TrayService: Received event 'FOCUS_SESSION_ENDED'");
      this.changeTrayState(TrayState.DEFAULT);
    });
  }

  private _refreshTrayContextMenu(): void {
    console.log('TrayService: Refreshing tray context menu');
    const contextMenu = this._getTrayContextMenu();
    this.tray?.setContextMenu(contextMenu);
  }

  public initService(): void {
    if (!this.isServiceInitialized) {
      this.registerActionHandlers();
      this.registerAppEventHandlers();
      this.isServiceInitialized = true;
    }
  }

  public addRegisteredShortcuts(registeredShortcuts: shortcutRegisteredResult[]): void {
    invariant(this.isServiceInitialized, 'TrayService not initialized');
    this.receivedRegisteredShortcuts = registeredShortcuts;
    this._refreshTrayContextMenu();
  }

  /**
   * Creates an instance of the tray icon.
   * @param logger
   */
  public createTrayInstance(logger: Logger): void {
    invariant(this.isServiceInitialized, 'TrayService not initialized');
    const trayIconPath = app.getAppPath() + '/resources/images/trici_tray_icon_amber.png';
    logger.info(`Tray icon path: ${trayIconPath}`);
    this.tray = new Tray(trayIconPath);
    // this._tray.setToolTip(config.trayIconToolTip);
    const contextMenu = this._getTrayContextMenu();
    this.tray.setContextMenu(contextMenu);
  }

  public changeTrayState(newState: TrayState): void {
    invariant(this.isServiceInitialized, 'TrayService not initialized');
    this.trayState = newState;
    if (newState === TrayState.DEFAULT) {
      this.tray?.setImage(app.getAppPath() + '/resources/images/trici_tray_icon_amber.png');
    } else if (newState === TrayState.SESSION_IN_PROGRESS) {
      this.tray?.setImage(app.getAppPath() + '/resources/images/trici_tray_icon_red.png');
    }
    const contextMenu = this._getTrayContextMenu();
    this.tray?.setContextMenu(contextMenu);
  }

  public destroyTrayInstance(): void {
    this.tray?.destroy();
  }
}

export default TrayService;
