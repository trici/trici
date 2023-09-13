import { globalShortcut } from 'electron';
import config from '@trici/config';
import { dispatch } from './ActionDispatcher';
import isAccelerator from 'electron-is-accelerator';
import { Constants, SESSION_STARTED_BY, SESSION_STARTED_FROM } from '@trici/models';

export interface IGlobalShortcutService {
  initService(): void;
}

type shortcutRegisteredResult = { isRegistered: boolean; shortcut: string };

export class GlobalShortcutService implements IGlobalShortcutService {
  private initialized = false;
  private globalShowHideShortcutRegistered: shortcutRegisteredResult = { isRegistered: false, shortcut: '' };
  private globalStartFocusSessionShortcutRegistered: shortcutRegisteredResult = { isRegistered: false, shortcut: '' };
  private globalStopFocusSessionShortcutRegistered: shortcutRegisteredResult = { isRegistered: false, shortcut: '' };
  private reloadOpenWindowsShortcutRegistered: shortcutRegisteredResult = { isRegistered: false, shortcut: '' };
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
    let result = { isRegistered: false, shortcut: shortcutToRegister };
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

      console.log(
        'GlobalShortcutService: initService: globalShowHideShortcutRegistered: ',
        this.globalShowHideShortcutRegistered,
      );
      console.log(
        'GlobalShortcutService: initService: globalStartFocusSessionShortcutRegistered: ',
        this.globalStartFocusSessionShortcutRegistered,
      );
      console.log(
        'GlobalShortcutService: initService: globalStopFocusSessionShortcutRegistered: ',
        this.globalStopFocusSessionShortcutRegistered,
      );
      console.log(
        'GlobalShortcutService: initService: reloadOpenWindowsShortcutRegistered: ',
        this.reloadOpenWindowsShortcutRegistered,
      );

      this.initialized = true;
    }
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
