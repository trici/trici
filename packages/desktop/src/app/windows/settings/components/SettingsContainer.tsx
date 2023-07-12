import React, { useState, useEffect } from 'react';
import { SettingsNav } from './SettingsNav';
import { AppShell } from '@mantine/core';
import { UserPreferences } from '@trici/models';
import { IconSettings } from '@tabler/icons-react';
import { SettingsKey, ISettingsItem } from '../typedefs/types';
import { GlobalShortcuts } from './GlobalShortcuts';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RendererRepository } from '../../../dataaccess/RendererRepository';
import { IBridgeAPIInterface } from '../../../../typedefs/preload';
import { SelectScreenToRecord } from './SelectScreenToRecord';
import { IMessageFromMain } from '../../../../typedefs/preload';

const bridgeApi: IBridgeAPIInterface = window.bridgeApi;

console.log('bridgeApi', bridgeApi);

const renderRepository = RendererRepository.getInstance();

interface SettingsContainerState {
  settingsItems: ISettingsItem[];
}

type SaveUserPreferencesArgs = {
  userPreferences: UserPreferences;
  idOfDocToDelete: string;
};

export function SettingsContainer({ activeSettingsItem }: { activeSettingsItem: SettingsKey }) {
  const isSettingsItemActive = (settingsKey: SettingsKey) => {
    return settingsKey === activeSettingsItem;
  };

  const _getSettingsItems = (): ISettingsItem[] => {
    const settingsItems = [
      {
        key: SettingsKey.SHORTCUTS,
        label: 'Shortcuts',
        icon: IconSettings,
        isActive: isSettingsItemActive(SettingsKey.SHORTCUTS),
      },
      {
        key: SettingsKey.SCREEN_TO_RECORD,
        label: 'Screen to Record',
        icon: IconSettings,
        isActive: isSettingsItemActive(SettingsKey.SCREEN_TO_RECORD),
      },
      {
        key: SettingsKey.FOCUS_SESSION,
        label: 'Focus Session',
        icon: IconSettings,
        isActive: isSettingsItemActive(SettingsKey.FOCUS_SESSION),
      },
      {
        key: SettingsKey.WEBSITE_BLOCKING,
        label: 'Website Blocking',
        icon: IconSettings,
        isActive: isSettingsItemActive(SettingsKey.WEBSITE_BLOCKING),
      },
      {
        key: SettingsKey.STORAGE,
        label: 'Storage',
        icon: IconSettings,
        isActive: isSettingsItemActive(SettingsKey.STORAGE),
      },
      {
        key: SettingsKey.SOUNDS,
        label: 'Sounds',
        icon: IconSettings,
        isActive: isSettingsItemActive(SettingsKey.SOUNDS),
      },
      {
        key: SettingsKey.UPDATES,
        label: 'Updates',
        icon: IconSettings,
        isActive: isSettingsItemActive(SettingsKey.UPDATES),
      },
      {
        key: SettingsKey.LOGGING,
        label: 'Logging',
        icon: IconSettings,
        isActive: isSettingsItemActive(SettingsKey.LOGGING),
      },
      { key: SettingsKey.ABOUT, label: 'About', icon: IconSettings, isActive: isSettingsItemActive(SettingsKey.ABOUT) },
    ];
    return settingsItems;
  };

  const [state, setState] = useState({
    settingsItems: _getSettingsItems(),
  });

  // useEffect(() => {
  //   console.log('SettingsContainer useEffect');
  //   if (activeSettingsItem) {
  //     _changeActiveSettingItem(activeSettingsItem);
  //   }
  // }, []);

  const queryClient = useQueryClient();

  const userPreferencesQuery = useQuery<UserPreferences>({
    queryKey: ['userPreferences'],
    queryFn: () => renderRepository.getUserPreferences(),
  });

  const saveUserPreferencesMutationFunction = ({ userPreferences, idOfDocToDelete }: SaveUserPreferencesArgs) => {
    console.log('saveUserPreferencesMutationFunction', userPreferences.toJS());
    return renderRepository.saveUserPreferences(userPreferences, idOfDocToDelete);
  };

  const mutation = useMutation({
    mutationFn: saveUserPreferencesMutationFunction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userPreferences'] });
    },
  });

  const _updateUserPreferences = (userPreferences: UserPreferences, idOfDocToDelete: string) => {
    // console.log('updatedUserPreferences', userPreferences.toJS());
    // console.log('idOfDocToDelete', idOfDocToDelete);
    mutation.mutate({ userPreferences, idOfDocToDelete });
  };

  const _changeActiveSettingItem = (selectedKey: SettingsKey) => {
    // Map over your existing state to create a new array
    const updatedItems = state.settingsItems.map(item => {
      // If the item's key matches the selected key, set isActive to true
      if (item.key === selectedKey) {
        return { ...item, isActive: true };
      }
      // Otherwise, set isActive to false
      return { ...item, isActive: false };
    });

    // Update your state with the new array
    setState({
      ...state,
      settingsItems: updatedItems,
    });
  };

  const activeItem = state.settingsItems.find(item => item.isActive);

  if (userPreferencesQuery.isLoading) {
    return <div>Loading...</div>;
  }

  if (userPreferencesQuery.error) {
    return <div>Error: {userPreferencesQuery.error.toString()}</div>;
  }

  return (
    <>
      <AppShell navbar={<SettingsNav items={state.settingsItems} onChangeNavItem={_changeActiveSettingItem} />}>
        {activeItem && activeItem.key === SettingsKey.SHORTCUTS && (
          <GlobalShortcuts userPreferences={userPreferencesQuery.data} onSave={_updateUserPreferences} />
        )}
        {activeItem && activeItem.key === SettingsKey.SCREEN_TO_RECORD && (
          <SelectScreenToRecord userPreferences={userPreferencesQuery.data} onSave={_updateUserPreferences} />
        )}
        {activeItem && activeItem.key === SettingsKey.FOCUS_SESSION && <div>Focus Session</div>}
        {activeItem && activeItem.key === SettingsKey.WEBSITE_BLOCKING && <div>Website Blocking</div>}
        {activeItem && activeItem.key === SettingsKey.STORAGE && <div>Storage</div>}
        {activeItem && activeItem.key === SettingsKey.SOUNDS && <div>Sounds</div>}
        {activeItem && activeItem.key === SettingsKey.UPDATES && <div>Updates</div>}
        {activeItem && activeItem.key === SettingsKey.LOGGING && <div>Logging</div>}
        {activeItem && activeItem.key === SettingsKey.ABOUT && <div>About</div>}
      </AppShell>
    </>
  );
}
