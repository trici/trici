import React, { useState, useEffect } from 'react';
import { IConfigureGlobalShortcutProps, IConfigureGlobalShortcutState } from '../typedefs/SettingsWindowTypes';
import { Constants } from '@trici/models';
import { Button, TextInput, createStyles } from '@mantine/core';
import { IconDeviceFloppy } from '@tabler/icons-react';
import isAccelerator from 'electron-is-accelerator';

const useStyles = createStyles(theme => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '100%',
    height: '110px',
  },
  item: {
    width: '100%',
  },
}));

export function ConfigureGlobalShortcut({
  label,
  currentShortcut,
  defaultShortcut,
  onShortcutChange,
}: IConfigureGlobalShortcutProps) {
  const [state, setState] = useState<IConfigureGlobalShortcutState>({
    shortcut: currentShortcut === Constants.EMPTY_STRING ? defaultShortcut : currentShortcut,
    isShortcutValid: true,
  });

  // useEffect(() => {
  //   setState({
  //     ...state,
  //     shortcut: currentShortcut,
  //   });
  // }, [currentShortcut]);

  const _onShortcutChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const changedShortcut = event.target.value;
    const isValidAccelerator = isAccelerator(changedShortcut);
    setState({
      ...state,
      shortcut: event.target.value,
      isShortcutValid: isValidAccelerator,
    });
  };

  const _onShortcutBlur = () => {
    // if (state.shortcut === '') {
    //   setState({
    //     ...state,
    //     shortcut: defaultShortcut,
    //   });
    // }
    // onShortcutChange(state.shortcut);
  };

  const _saveShortcut = () => {
    onShortcutChange(state.shortcut);
  };

  const { classes } = useStyles();

  const invalidShortcutMessage = state.isShortcutValid ? '' : 'Invalid shortcut';
  return (
    <div className={classes.root}>
      <div className={classes.item}>
        <TextInput
          className={classes.item}
          label={label}
          value={state.shortcut}
          onChange={_onShortcutChange}
          onBlur={_onShortcutBlur}
          error={invalidShortcutMessage}
        />
      </div>
      <div className={classes.item}>
        <Button
          onClick={_saveShortcut}
          variant="default"
          leftIcon={<IconDeviceFloppy size="1rem" />}
          disabled={!state.isShortcutValid}
        >
          Save
        </Button>
      </div>
    </div>
  );
}
