import React, { useState, useEffect } from 'react';

import { IConfigureGlobalShortcutProps, IConfigureGlobalShortcutState } from '../typedefs/SettingsWindowTypes';
import { Constants } from '@trici/models';
import isAccelerator from 'electron-is-accelerator';
import { Button, TextBox } from '@singhshashi/proactive';

export function ConfigureGlobalShortcut({
  label,
  currentShortcut,
  defaultShortcut,
  onShortcutChange,
}: IConfigureGlobalShortcutProps) {
  const [state, setState] = useState<IConfigureGlobalShortcutState>({
    shortcut: currentShortcut === undefined ? defaultShortcut : currentShortcut,
    isShortcutValid: true,
  });

  const _isSaveButtonEnabled = () => {
    if (!state.isShortcutValid) {
      return false;
    }
    if (currentShortcut === undefined) {
      return state.shortcut !== defaultShortcut;
    }
    if (currentShortcut) {
      return state.shortcut !== currentShortcut;
    }
  };

  const _onShortcutChange = (newValue: string) => {
    const changedShortcut = newValue.trim();
    const isValidAccelerator = isAccelerator(changedShortcut);
    setState({
      ...state,
      shortcut: newValue.trim(),
      isShortcutValid: isValidAccelerator,
    });
  };

  const _onShortcutBlur = () => {
    if (state.shortcut === '') {
      setState({
        ...state,
        shortcut: defaultShortcut,
      });
    }
  };

  const _saveShortcut = () => {
    if (state.isShortcutValid) {
      onShortcutChange(state.shortcut);
    }
  };

  const invalidShortcutMessage = state.isShortcutValid ? '' : 'Invalid shortcut';
  return (
    <div className="align-start flex h-full w-full flex-col justify-between gap-2">
      <div className="w-[350px]">
        <TextBox
          label={label}
          value={state.shortcut}
          onChange={_onShortcutChange}
          onBlur={_onShortcutBlur}
          error={invalidShortcutMessage}
        />
      </div>
      <div className="w-[350px]">
        <Button onClick={_saveShortcut} variant="default" disabled={!_isSaveButtonEnabled()}>
          Save
        </Button>
      </div>
    </div>
  );
}
