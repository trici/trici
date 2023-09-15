import { globalShortcut } from 'electron';
import config from '@trici/config';
import { dispatch } from './ActionDispatcher';
import isAccelerator from 'electron-is-accelerator';
import { Constants, SESSION_STARTED_BY, SESSION_STARTED_FROM } from '@trici/models';

export interface IGlobalShortcutService {
  initService(): void;
  getRegisteredShortcuts(): shortcutRegisteredResult[];
}

export enum shortcutType {
  SHOW_TRICI_SHORTCUT = 'SHOW_TRICI_SHORTCUT',
  START_FOCUS_SESSION_SHORTCUT = 'START_FOCUS_SESSION_SHORTCUT',
  STOP_FOCUS_SESSION_SHORTCUT = 'STOP_FOCUS_SESSION_SHORTCUT',
  RELOAD_OPEN_WINDOWS_SHORTCUT = 'RELOAD_OPEN_WINDOWS_SHORTCUT',
}

export type shortcutRegisteredResult = { isRegistered: boolean; shortcut: string; type: string };

export class GlobalShortcutService implements IGlobalShortcutService {
  private initialized = false;
  private globalShowHideShortcutRegistered: shortcutRegisteredResult = {
    isRegistered: false,
    shortcut: '',
    type: shortcutType.SHOW_TRICI_SHORTCUT,
  };
  private globalStartFocusSessionShortcutRegistered: shortcutRegisteredResult = {
    isRegistered: false,
    shortcut: '',
    type: shortcutType.START_FOCUS_SESSION_SHORTCUT,
  };
  private globalStopFocusSessionShortcutRegistered: shortcutRegisteredResult = {
    isRegistered: false,
    shortcut: '',
    type: shortcutType.STOP_FOCUS_SESSION_SHORTCUT,
  };
  private reloadOpenWindowsShortcutRegistered: shortcutRegisteredResult = {
    isRegistered: false,
    shortcut: '',
    type: shortcutType.RELOAD_OPEN_WINDOWS_SHORTCUT,
  };

  private determineShortcut(
    shortcut: string,
    userPreferenceKey: string,
    defaultDevShortcut: string,
    defaultProdShortcut: string,
  ): string {
    if (shortcut) return shortcut;
    if (global.userPreferences[userPreferenceKey]) return global.userPreferences[userPreferenceKey];
    return config.builtFor === 'dev' ? defaultDevShortcut : defaultProdShortcut;
  }

  private registerShortcutWithConfiguration(
    shortcut: string,
    userPreferenceKey: string,
    defaultDevShortcut: string,
    defaultProdShortcut: string,
    existingShortcutRegisteredResult: shortcutRegisteredResult,
    shortcutHandler: () => void,
  ): shortcutRegisteredResult {
    const shortcutToRegister = this.determineShortcut(
      shortcut,
      userPreferenceKey,
      defaultDevShortcut,
      defaultProdShortcut,
    );
    let result = { isRegistered: false, shortcut: shortcutToRegister, type: existingShortcutRegisteredResult.type };
    result.isRegistered = this.#registerShortcut(shortcutToRegister, existingShortcutRegisteredResult, shortcutHandler);
    return result;
  }

  initService(): void {
    if (!this.initialized) {
      if (config.builtFor === 'dev') {
        this.reloadOpenWindowsShortcutRegistered.isRegistered = this.#registerShortcut(
          'CommandOrControl+shift+R',
          this.reloadOpenWindowsShortcutRegistered,
          () => {
            dispatch({ type: 'RELOAD_OPEN_WINDOWS' });
          },
        );
      }
      console.log(`GlobalShortcutService: initService.userPreferences: ${JSON.stringify(global.userPreferences)}`);
      this.globalShowHideShortcutRegistered = this.registerShortcutWithConfiguration(
        global.userPreferences.globalShowHideShortcut,
        'globalShowHideShortcut',
        Constants.DEFAULT_GLOBAL_SHOW_HIDE_SHORTCUT_DEV,
        Constants.DEFAULT_GLOBAL_SHOW_HIDE_SHORTCUT_PROD,
        this.globalShowHideShortcutRegistered,
        () => {
          dispatch({ type: 'SHOW_TRICI' });
        },
      );

      this.globalStartFocusSessionShortcutRegistered = this.registerShortcutWithConfiguration(
        global.userPreferences.globalStartFocusSessionShortcut,
        'globalStartFocusSessionShortcut',
        Constants.DEFAULT_GLOBAL_START_FOCUS_SESSION_SHORTCUT_DEV,
        Constants.DEFAULT_GLOBAL_START_FOCUS_SESSION_SHORTCUT_PROD,
        this.globalStartFocusSessionShortcutRegistered,
        () => {
          dispatch({
            type: 'START_FOCUS_SESSION',
            startedBy: SESSION_STARTED_BY.USER,
            startedFrom: SESSION_STARTED_FROM.SHORTCUT,
          });
        },
      );

      this.globalStopFocusSessionShortcutRegistered = this.registerShortcutWithConfiguration(
        global.userPreferences.globalStopFocusSessionShortcut,
        'globalStopFocusSessionShortcut',
        Constants.DEFAULT_GLOBAL_STOP_FOCUS_SESSION_SHORTCUT_DEV,
        Constants.DEFAULT_GLOBAL_STOP_FOCUS_SESSION_SHORTCUT_PROD,
        this.globalStopFocusSessionShortcutRegistered,
        () => {
          dispatch({ type: 'END_FOCUS_SESSION' });
        },
      );
      this.initialized = true;
    }
  }

  getRegisteredShortcuts(): shortcutRegisteredResult[] {
    return [
      this.globalShowHideShortcutRegistered,
      this.globalStartFocusSessionShortcutRegistered,
      this.globalStopFocusSessionShortcutRegistered,
      this.reloadOpenWindowsShortcutRegistered,
    ];
  }

  #registerShortcut(
    shortcut: string,
    existingShortcutRegisteredResult: shortcutRegisteredResult,
    shortcutHandler: () => void,
  ): boolean {
    console.log('registering shortcut: ', shortcut);
    if (!isAccelerator(shortcut)) {
      return false;
    }
    if (!globalShortcut.isRegistered(shortcut)) {
      if (existingShortcutRegisteredResult.isRegistered) {
        globalShortcut.unregister(existingShortcutRegisteredResult.shortcut);
      }
      const shortcutRegistered = globalShortcut.register(shortcut, shortcutHandler);
      return shortcutRegistered;
    }
    return true;
  }
}
