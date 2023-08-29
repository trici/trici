/**
 * @file Tray Service
 * @description The tray service creates an instance of the tray icon and provides methods for interacting with it.
 * @module @trici/desktop/TrayService
 * @requires electron
 *
 */

import { app, Menu, Tray } from 'electron';
import { TrayState } from '@trici/models';
import type { Logger } from '@trici/logger';
import { dispatch } from './ActionDispatcher';
import { SettingsKey } from '../app/windows/settings/typedefs/SettingsWindowTypes';

export interface ITrayService {
  createTrayInstance(logger: Logger): void;
}

class TrayService implements ITrayService {
  private _tray?: Tray;
  private _trayState: TrayState;
  constructor() {
    this._tray = undefined;
    this._trayState = TrayState.DEFAULT;
  }

  private _getTrayContextMenu(): Menu {
    let template: any[] = [];
    if (this._trayState === TrayState.DEFAULT) {
      template = [
        {
          label: 'Show/Hide Trici',
          click: () => {
            console.log('Show/Hide Trici');
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
    } else if (this._trayState === TrayState.SESSION_IN_PROGRESS) {
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
          },
        },
      ];
    }
    return Menu.buildFromTemplate(template);
  }

  public createTrayInstance(logger: Logger): void {
    const trayIconPath = app.getAppPath() + '/resources/images/trici_tray_icon_amber.png';
    logger.info(`Tray icon path: ${trayIconPath}`);
    this._tray = new Tray(trayIconPath);
    // this._tray.setToolTip(config.trayIconToolTip);
    const contextMenu = this._getTrayContextMenu();
    this._tray.setContextMenu(contextMenu);
  }
}

const instance = new TrayService();
export default instance;
