import React, { useState, useEffect } from 'react';
import { ISettingsItemComponentProps } from '../typedefs/SettingsWindowTypes';
import { Constants, IUserPreferences } from '@trici/models';
import { ConfigureGlobalShortcut } from './ConfigureGlobalShortcut';

export function GlobalShortcuts({ userPreferences, onSave }: ISettingsItemComponentProps) {
  const _getUpdatedUserPreferencesObject = (updatedProperty: keyof IUserPreferences, updatedValue: string) => {
    if (userPreferences) {
      const updatedUserPreferences = userPreferences.set(updatedProperty, updatedValue);
      return { updatedUserPreferences };
    }
  };

  const _onChangeGlobalShowHideShortcut = (shortcut: string) => {
    const result = _getUpdatedUserPreferencesObject('globalShowHideShortcut', shortcut);
    if (result) {
      onSave(result.updatedUserPreferences);
    } else {
      throw new Error('GlobalShortcuts._onChangeGlobalShowHideShortcut: result is null');
    }
  };

  const _onChangeGlobalStartFocusSessionShortcut = (shortcut: string) => {
    const result = _getUpdatedUserPreferencesObject('globalStartFocusSessionShortcut', shortcut);
    if (result) {
      onSave(result.updatedUserPreferences);
    } else {
      throw new Error('GlobalShortcuts._onChangeGlobalStartFocusSessionShortcut: result is null');
    }
  };

  const _onChangeGlobalStopFocusSessionShortcut = (shortcut: string) => {
    const result = _getUpdatedUserPreferencesObject('globalStopFocusSessionShortcut', shortcut);
    if (result) {
      onSave(result.updatedUserPreferences);
    } else {
      throw new Error('GlobalShortcuts._onChangeGlobalStopFocusSessionShortcut: result is null');
    }
  };

  const _onChangeGlobalRecordVoiceNoteShortcut = (shortcut: string) => {
    const result = _getUpdatedUserPreferencesObject('globalRecordVoiceNoteShortcut', shortcut);
    if (result) {
      onSave(result.updatedUserPreferences);
    } else {
      throw new Error('GlobalShortcuts._onChangeGlobalRecordVoiceNoteShortcut: result is null');
    }
  };

  // const _onChangeGlobalPingFunctionShortcut = (shortcut: string) => {
  //   const result = _getUpdatedUserPreferencesObject('globalPingFunctionShortcut', shortcut);
  //   if (result) {
  //     onSave(result.updatedUserPreferences, result.idOfDocToDelete);
  //   } else {
  //     throw new Error('GlobalShortcuts._onChangeGlobalPingFunctionShortcut: result is null');
  //   }
  // };

  if (!userPreferences) {
    return null;
  }

  const config = window.bridgeApi.triciConfig;
  const defaultGlobalShowHideShortcut =
    config.builtFor === 'dev'
      ? Constants.DEFAULT_GLOBAL_SHOW_HIDE_SHORTCUT_DEV
      : Constants.DEFAULT_GLOBAL_SHOW_HIDE_SHORTCUT_PROD;
  const defaultGlobalStartFocusSessionShortcut =
    config.builtFor === 'dev'
      ? Constants.DEFAULT_GLOBAL_START_FOCUS_SESSION_SHORTCUT_DEV
      : Constants.DEFAULT_GLOBAL_START_FOCUS_SESSION_SHORTCUT_PROD;
  const defaultGlobalStopFocusSessionShortcut =
    config.builtFor === 'dev'
      ? Constants.DEFAULT_GLOBAL_STOP_FOCUS_SESSION_SHORTCUT_DEV
      : Constants.DEFAULT_GLOBAL_STOP_FOCUS_SESSION_SHORTCUT_PROD;
  const defaultGlobalPingFunctionShortcut = 'CommandOrControl+Shift+F';
  const defaultGlobalRecordVoiceNoteShortcut = 'Option+Shift+V';

  return (
    <div className="flex h-full flex-col justify-start gap-5 py-4">
      <div>
        <ConfigureGlobalShortcut
          label="Show/Hide Trici"
          currentShortcut={userPreferences.globalShowHideShortcut}
          defaultShortcut={defaultGlobalShowHideShortcut}
          onShortcutChange={_onChangeGlobalShowHideShortcut}
        />
      </div>
      <div>
        <ConfigureGlobalShortcut
          label="Start a Focus Session"
          currentShortcut={userPreferences.globalStartFocusSessionShortcut}
          defaultShortcut={defaultGlobalStartFocusSessionShortcut}
          onShortcutChange={_onChangeGlobalStartFocusSessionShortcut}
        />
      </div>
      <div>
        <ConfigureGlobalShortcut
          label="Stop a Focus Session"
          currentShortcut={userPreferences.globalStopFocusSessionShortcut}
          defaultShortcut={defaultGlobalStopFocusSessionShortcut}
          onShortcutChange={_onChangeGlobalStopFocusSessionShortcut}
        />
      </div>
      <div>
        <ConfigureGlobalShortcut
          label="Record a Voice Note"
          currentShortcut={userPreferences.globalRecordVoiceNoteShortcut}
          defaultShortcut={defaultGlobalRecordVoiceNoteShortcut}
          onShortcutChange={_onChangeGlobalRecordVoiceNoteShortcut}
        />
      </div>
      {/* <div>
        <ConfigureGlobalShortcut
          label="Ping Function"
          currentShortcut={userPreferences.globalPingFunctionShortcut}
          defaultShortcut={defaultGlobalPingFunctionShortcut}
          onShortcutChange={_onChangeGlobalPingFunctionShortcut}
        />
      </div> */}
    </div>
  );
}
