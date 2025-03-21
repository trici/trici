import { globalShortcut } from 'electron';
import config from '@trici/config';
import { dispatch } from './ActionDispatcher';
import isAccelerator from 'electron-is-accelerator';
import { Constants, SessionTrigger } from '@trici/models';

export interface IGlobalShortcutService {
  initService(): void;
  getRegisteredShortcuts(): shortcutRegisteredResult[];
}

export enum shortcutType {
  SHOW_HIDE_TRICI_SHORTCUT = 'SHOW_HIDE_TRICI_SHORTCUT',
  START_FOCUS_SESSION_SHORTCUT = 'START_FOCUS_SESSION_SHORTCUT',
  STOP_FOCUS_SESSION_SHORTCUT = 'STOP_FOCUS_SESSION_SHORTCUT',
  RELOAD_OPEN_WINDOWS_SHORTCUT = 'RELOAD_OPEN_WINDOWS_SHORTCUT',
  PING_FUNCTION_SHORTCUT = 'PING_FUNCTION_SHORTCUT',
}

export type shortcutRegisteredResult = { isRegistered: boolean; shortcut: string; type: string };

export class GlobalShortcutService implements IGlobalShortcutService {
  private initialized = false;
  private globalShowHideShortcutRegistered: shortcutRegisteredResult = {
    isRegistered: false,
    shortcut: '',
    type: shortcutType.SHOW_HIDE_TRICI_SHORTCUT,
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
  private globalPingFunctionShortcutRegistered: shortcutRegisteredResult = {
    isRegistered: false,
    shortcut: '',
    type: shortcutType.PING_FUNCTION_SHORTCUT,
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
      if (config.builtFor === 'dev' || config.builtFor === 'livedev') {
        this.reloadOpenWindowsShortcutRegistered.isRegistered = globalShortcut.register(
          'CommandOrControl+shift+R',
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
          dispatch({ type: 'SHOW_HIDE_TRICI' });
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
            startTrigger: SessionTrigger.SHORTCUT,
            sessionStartMetadata: {},
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
          dispatch({ type: 'END_FOCUS_SESSION', endTrigger: SessionTrigger.SHORTCUT });
        },
      );

      this.globalPingFunctionShortcutRegistered = this.registerShortcutWithConfiguration(
        global.userPreferences.globalPingFunctionShortcut,
        'globalPingFunctionShortcut',
        'CommandOrControl+Shift+F',
        '', // This is only used for debugging in dev at the moment
        this.globalPingFunctionShortcutRegistered,
        () => {
          dispatch({
            type: 'SHOW_ALERT_WINDOW',
            args: {
              alertType: 'UPDATE_AVAILABLE',
              quitAppOnClose: false,
            },
          });
          // dispatch({ type: 'PING_FUNCTION' });
          // console.log('pingFunction called');
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
      this.globalPingFunctionShortcutRegistered,
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
