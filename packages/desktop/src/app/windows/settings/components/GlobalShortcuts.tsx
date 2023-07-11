import React, { useState, useEffect } from 'react';
import { ISettingsItemComponentProps } from '../typedefs/types';
import { Constants, IUserPreferences } from '@trici/models';
import { ConfigureGlobalShortcut } from './ConfigureGlobalShortcut';
import { generateUpdatedTriciId } from '../../../common/Utils';

export function GlobalShortcuts({ userPreferences, onSave }: ISettingsItemComponentProps) {
  const _getUpdatedUserPreferencesObject = (updatedProperty: keyof IUserPreferences, updatedValue: string) => {
    let updatedUserPreferences;
    if (userPreferences) {
      const idOfDocToDelete = userPreferences._id;
      const updatedId = generateUpdatedTriciId(idOfDocToDelete);
      updatedUserPreferences = userPreferences.withMutations(up => {
        up.set('_id', updatedId).set(updatedProperty, updatedValue);
      });
      return { updatedUserPreferences, idOfDocToDelete };
    }
  };

  const _onChangeGlobalShowHideShortcut = (shortcut: string) => {
    const result = _getUpdatedUserPreferencesObject('globalShowHideShortcut', shortcut);
    if (result) {
      onSave(result.updatedUserPreferences, result.idOfDocToDelete);
    } else {
      throw new Error('GlobalShortcuts._onChangeGlobalShowHideShortcut: result is null');
    }
  };

  const _onChangeGlobalStartFocusSessionShortcut = (shortcut: string) => {
    const result = _getUpdatedUserPreferencesObject('globalStartFocusSessionShortcut', shortcut);
    if (result) {
      onSave(result.updatedUserPreferences, result.idOfDocToDelete);
    } else {
      throw new Error('GlobalShortcuts._onChangeGlobalStartFocusSessionShortcut: result is null');
    }
  };

  const _onChangeGlobalStopFocusSessionShortcut = (shortcut: string) => {
    const result = _getUpdatedUserPreferencesObject('globalStopFocusSessionShortcut', shortcut);
    if (result) {
      onSave(result.updatedUserPreferences, result.idOfDocToDelete);
    } else {
      throw new Error('GlobalShortcuts._onChangeGlobalStopFocusSessionShortcut: result is null');
    }
  };

  if (!userPreferences) {
    return null;
  }

  return (
    <div>
      <p>Shortcuts</p>
      <ConfigureGlobalShortcut
        label="Show/Hide Trici"
        currentShortcut={userPreferences.globalShowHideShortcut}
        defaultShortcut={Constants.DEFAULT_GLOBAL_SHOW_HIDE_SHORTCUT}
        onShortcutChange={_onChangeGlobalShowHideShortcut}
      />
      <ConfigureGlobalShortcut
        label="Start a Focus Session"
        currentShortcut={userPreferences.globalStartFocusSessionShortcut}
        defaultShortcut={Constants.DEFAULT_START_FOCUS_SESSION_SHORTCUT}
        onShortcutChange={_onChangeGlobalStartFocusSessionShortcut}
      />
      <ConfigureGlobalShortcut
        label="Stop a Focus Session"
        currentShortcut={userPreferences.globalStopFocusSessionShortcut}
        defaultShortcut={Constants.DEFAUL_STOP_FOCUS_SESSION_SHORTCUT}
        onShortcutChange={_onChangeGlobalStopFocusSessionShortcut}
      />
    </div>
  );
}
