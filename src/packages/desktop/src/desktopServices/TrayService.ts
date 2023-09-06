/**
 * @file Tray Service
 * @description The tray service creates an instance of the tray icon and provides methods for interacting with it.
 * @module @trici/desktop/TrayService
 * @requires electron
 *
 */

import { App, app, Menu, Tray } from 'electron';
import { SESSION_STARTED_BY, SESSION_STARTED_FROM, TrayState, TRICI_APP_EVENT } from '@trici/models';
import type { Logger } from '@trici/logger';
import { dispatch, IActionDispatcher } from './ActionDispatcher';
import { SettingsKey } from '../app/windows/settings/typedefs/SettingsWindowTypes';
import { TriciAction } from '../typedefs/TriciAction';
import { AppEventEmitter } from './AppEventEmitter';
import { ITriciDesktopService } from '../typedefs/ITriciDesktopService';
import { invariant } from '@trici/utils';

/**
 */
export interface ITrayService {
  /**
   * Creates an instance of the tray icon.
   * @param logger
   */
  createTrayInstance(logger: Logger): void;
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
  actionHandlersRegistered: boolean = false;
  eventBus: AppEventEmitter;
  isServiceInitialized: boolean = false;

  constructor(actionDispatcher: IActionDispatcher<TriciAction>, eventBus: AppEventEmitter) {
    this.tray = undefined;
    this.trayState = TrayState.DEFAULT;
    this.actionDispatcher = actionDispatcher;
    this.actionHandlersRegistered = false;
    this.eventBus = eventBus;
    this.isServiceInitialized = false;
  }

  private _getTrayContextMenu(): Menu {
    let template: any[] = [];
    if (this.trayState === TrayState.DEFAULT) {
      template = [
        {
          label: 'Show/Hide Trici',
          click: () => {
            console.log('Show/Hide Trici');
          },
        },
        {
          label: 'Start Focus Session',
          click: () => {
            dispatch({
              type: 'START_FOCUS_SESSION',
              startedBy: SESSION_STARTED_BY.USER,
              startedFrom: SESSION_STARTED_FROM.TRAY,
            });
          },
        },
        {
          label: 'Settings',
          click: () => {
            dispatch({ type: 'OPEN_SETTINGS_WINDOW', args: { section: SettingsKey.SCREEN_TO_RECORD } });
          },
        },
        {
          label: 'Quit',
          click: () => {
            app.quit();
          },
        },
      ];
    } else if (this.trayState === TrayState.SESSION_IN_PROGRESS) {
      template = [
        {
          label: 'Show/Hide Trici',
          click: () => {
            console.log('Show/Hide Trici');
          },
        },
        {
          label: 'Stop Session',
          click: () => {
            console.log('Stop Session');
            dispatch({ type: 'END_FOCUS_SESSION' });
          },
        },
      ];
    }
    return Menu.buildFromTemplate(template);
  }

  private registerActionHandlers(): void {
    if (!this.actionHandlersRegistered) {
      this.actionDispatcher.register((action: TriciAction) => {
        switch (action.type) {
          case 'CLEANUP_BEFORE_SHUTDOWN':
            this.destroyTrayInstance();
            break;
          default:
            break;
        }
      });
      this.actionHandlersRegistered = true;
    }
  }

  private registerAppEventHandlers(): void {
    this.eventBus.on(TRICI_APP_EVENT.FOCUS_SESSION_STARTED, () => {
      console.log("TrayService: Received event 'FOCUS_SESSION_STARTED'");
      this.changeTrayState(TrayState.SESSION_IN_PROGRESS);
    });
    this.eventBus.on(TRICI_APP_EVENT.FOCUS_SESSION_ENDED, () => {
      console.log("TrayService: Received event 'FOCUS_SESSION_ENDED'");
      this.changeTrayState(TrayState.DEFAULT);
    });
  }

  public initService(): void {
    if (!this.isServiceInitialized) {
      this.registerActionHandlers();
      this.registerAppEventHandlers();
      this.isServiceInitialized = true;
    }
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
