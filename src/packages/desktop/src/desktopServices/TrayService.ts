/**
 * @file Tray Service
 * @description The tray service creates an instance of the tray icon and provides methods for interacting with it.
 * @module @trici/desktop/TrayService
 * @requires electron
 *
 */

import { app, BrowserWindow, Menu, MenuItem, Tray } from 'electron';
import { SessionTrigger, TrayState, TriciAppEvent, UserActivityState } from '@trici/models';
import type { Logger } from '@trici/logger';
import { dispatch, IActionDispatcher } from './ActionDispatcher';
import { SettingsKey } from '../app/windows/settings/typedefs/SettingsWindowTypes';
import { TriciAction } from '../typedefs/TriciAction';
import { AppEventEmitter } from './AppEventEmitter';
import { ITriciDesktopService } from '../typedefs/ITriciDesktopService';
import { invariant } from '@trici/utils';
import { shortcutRegisteredResult, shortcutType } from './GlobalShortcutService';
import { UserActivityStateMachine } from '@trici/activmon';

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
  currentContextMenu?: Menu;
  actionDispatcher: IActionDispatcher<TriciAction>;
  eventBus: AppEventEmitter;
  isServiceInitialized: boolean = false;
  receivedRegisteredShortcuts: shortcutRegisteredResult[] | undefined;
  userActivityStateMachine: UserActivityStateMachine;

  constructor(
    actionDispatcher: IActionDispatcher<TriciAction>,
    eventBus: AppEventEmitter,
    userActivityStateMachine: UserActivityStateMachine,
  ) {
    this.tray = undefined;
    this.trayState = TrayState.DEFAULT;
    this.actionDispatcher = actionDispatcher;
    this.eventBus = eventBus;
    this.isServiceInitialized = false;
    this.receivedRegisteredShortcuts = undefined;
    this.userActivityStateMachine = userActivityStateMachine;
  }

  private _getMenuTemplate(trayState: TrayState): any[] {
    let template: any[] = [];
    const shouldHaveAccelerator = this.receivedRegisteredShortcuts && this.receivedRegisteredShortcuts.length > 0;
    if (trayState === TrayState.DEFAULT || trayState === TrayState.SLEEPING) {
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
          label: 'Record a Voice Note',
          accelerator: 'Option+Shift+V',
          click: () => {
            console.log('Dispatching RECORD_VOICE_NOTE action');
            dispatch({ type: 'RECORD_VOICE_NOTE' });
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
              startTrigger: SessionTrigger.TRAY,
              sessionStartMetadata: {},
            });
          },
        },
        {
          label: 'Sleep Mode',
          submenu: [
            {
              label: '5 minutes',
              click: () => {
                dispatch({
                  type: 'APP_SLEEP_REQUESTED',
                  payload: { durationMinutes: 5 },
                });
              },
            },
            {
              label: '15 minutes',
              click: () => {
                dispatch({
                  type: 'APP_SLEEP_REQUESTED',
                  payload: { durationMinutes: 15 },
                });
              },
            },
            {
              label: '30 minutes',
              click: () => {
                dispatch({
                  type: 'APP_SLEEP_REQUESTED',
                  payload: { durationMinutes: 30 },
                });
              },
            },
          ],
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
          label: 'Record a Voice Note',
          accelerator: 'Option+Shift+V',
          click: () => {
            dispatch({ type: 'RECORD_VOICE_NOTE' });
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
            dispatch({ type: 'END_FOCUS_SESSION', endTrigger: SessionTrigger.TRAY });
          },
        },
      ];
    }
    return template;
  }

  private _findMenuItemByLabel(menu: Menu, label: string): MenuItem | undefined {
    for (const item of menu.items) {
      if (item.label === label) {
        return item;
      }
      if (item.submenu) {
        const submenuItem = this._findMenuItemByLabel(item.submenu, label);
        if (submenuItem) {
          return submenuItem;
        }
      }
    }
    return undefined;
  }

  private _getTrayContextMenu(): Menu {
    let template = this._getMenuTemplate(this.trayState);
    console.log('TrayService: Tray context menu template: ', template);
    this.currentContextMenu = Menu.buildFromTemplate(template);
    return this.currentContextMenu;
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
    this.eventBus.on(TriciAppEvent.APP_SLEEP_STARTED, () => {
      console.log("TrayService: Received event 'APP_SLEEP_STARTED'");
      this.changeTrayState(TrayState.SLEEPING);
    });
    this.eventBus.on(TriciAppEvent.APP_SLEEP_ENDED, () => {
      console.log("TrayService: Received event 'APP_SLEEP_ENDED'");
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
      this.userActivityStateMachine.on('stateChanged', (newState: UserActivityState) => {
        this.refreshTrayIcon();
      });
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
    const trayIconPath = app.getAppPath() + '/resources/images/trici_tray_iconTemplate.png';
    logger.info(`Tray icon path: ${trayIconPath}`);
    this.tray = new Tray(trayIconPath);
    // this._tray.setToolTip(config.trayIconToolTip);
    const contextMenu = this._getTrayContextMenu();
    this.tray.setContextMenu(contextMenu);
  }

  public hasTrayInstance(): boolean {
    return !!this.tray && !this.tray.isDestroyed();
  }

  public getTrayMenuLabels(): string[] {
    if (!this.currentContextMenu) {
      return [];
    }
    return this.currentContextMenu.items.map(item => item.label).filter(Boolean);
  }

  public clickTrayMenuItem(label: string): void {
    if (!this.currentContextMenu) {
      throw new Error('Tray context menu is not available');
    }
    const item = this._findMenuItemByLabel(this.currentContextMenu, label);
    if (!item) {
      throw new Error(`Tray menu item "${label}" was not found`);
    }
    if (typeof item.click !== 'function') {
      throw new Error(`Tray menu item "${label}" is not clickable`);
    }
    item.click(item, BrowserWindow.getFocusedWindow(), { x: 0, y: 0 } as any);
  }

  public changeTrayState(newState: TrayState): void {
    invariant(this.isServiceInitialized, 'TrayService not initialized');
    this.trayState = newState;
    this.refreshTrayIcon();
    const contextMenu = this._getTrayContextMenu();
    this.tray?.setContextMenu(contextMenu);
  }

  private refreshTrayIcon(): void {
    const userActivityState = this.userActivityStateMachine.getCurrentState();

    if (this.trayState === TrayState.DEFAULT) {
      if (
        userActivityState === UserActivityState.ACTIVE ||
        userActivityState === UserActivityState.BECOMING_HYPER_ACTIVE
      ) {
        this.tray?.setImage(app.getAppPath() + '/resources/images/trici_tray_icon_blue.png');
      } else {
        this.tray?.setImage(app.getAppPath() + '/resources/images/trici_tray_iconTemplate.png');
      }
    } else if (this.trayState === TrayState.SESSION_IN_PROGRESS) {
      this.tray?.setImage(app.getAppPath() + '/resources/images/trici_tray_icon_red.png');
    } else if (this.trayState === TrayState.SLEEPING) {
      this.tray?.setImage(app.getAppPath() + '/resources/images/trici_tray_icon_gray.png');
    }
  }

  public destroyTrayInstance(): void {
    this.tray?.destroy();
  }
}

export default TrayService;
