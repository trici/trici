import React, { useState, useEffect } from 'react';
import { SettingsNav } from './SettingsNav';
import { UserPreferences } from '@trici/models';
import { SettingsKey, ISettingsItem } from '../typedefs/SettingsWindowTypes';
import { GlobalShortcuts } from './GlobalShortcuts';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RendererRepository } from '../../../dataaccess/RendererRepository';
import { IBridgeAPIInterface } from '../../../../typedefs/preload';
import { IMessageFromMain } from '../../../../typedefs/preload';
import { Surface } from '@singhshashi/proactive';
import { Applications } from './Applications';

const bridgeApi: IBridgeAPIInterface = window.bridgeApi;

console.log('bridgeApi', bridgeApi);

const renderRepository = RendererRepository.getInstance();

interface SettingsContainerState {
  settingsItems: ISettingsItem[];
}

type SaveUserPreferencesArgs = {
  userPreferences: UserPreferences;
};

export function SettingsContainer({ activeSettingsItem }: { activeSettingsItem: SettingsKey }) {
  const isSettingsItemActive = (settingsKey: SettingsKey) => {
    return settingsKey === activeSettingsItem;
  };

  const _getSettingsItems = (): ISettingsItem[] => {
    const settingsItems: ISettingsItem[] = [
      {
        key: SettingsKey.SHORTCUTS,
        label: 'Shortcuts',
        icon: 'Keyboard',
        isActive: isSettingsItemActive(SettingsKey.SHORTCUTS),
      },
      {
        key: SettingsKey.APPLICATIONS,
        label: 'Applications',
        icon: 'AppWindow',
        isActive: isSettingsItemActive(SettingsKey.APPLICATIONS),
      },
      {
        key: SettingsKey.FOCUS_SESSION,
        label: 'Focus Session',
        icon: 'Timer',
        isActive: isSettingsItemActive(SettingsKey.FOCUS_SESSION),
      },
      {
        key: SettingsKey.WEBSITE_BLOCKING,
        label: 'Website Blocking',
        icon: 'OctagonX',
        isActive: isSettingsItemActive(SettingsKey.WEBSITE_BLOCKING),
      },
      {
        key: SettingsKey.STORAGE,
        label: 'Storage',
        icon: 'HardDrive',
        isActive: isSettingsItemActive(SettingsKey.STORAGE),
      },
      {
        key: SettingsKey.SOUNDS,
        label: 'Sounds',
        icon: 'Volume2',
        isActive: isSettingsItemActive(SettingsKey.SOUNDS),
      },
      {
        key: SettingsKey.UPDATES,
        label: 'Updates',
        icon: 'RefreshCw',
        isActive: isSettingsItemActive(SettingsKey.UPDATES),
      },
      {
        key: SettingsKey.LOGGING,
        label: 'Logging',
        icon: 'ClipboardList',
        isActive: isSettingsItemActive(SettingsKey.LOGGING),
      },
      { key: SettingsKey.ABOUT, label: 'About', icon: 'Info', isActive: isSettingsItemActive(SettingsKey.ABOUT) },
    ];
    return settingsItems;
  };

  const [state, setState] = useState<SettingsContainerState>({
    settingsItems: _getSettingsItems(),
  });

  const queryClient = useQueryClient();

  const userPreferencesQuery = useQuery<UserPreferences>({
    queryKey: ['userPreferences'],
    queryFn: () => renderRepository.getUserPreferences(),
  });

  const saveUserPreferencesMutationFunction = ({ userPreferences }: SaveUserPreferencesArgs) => {
    console.log('saveUserPreferencesMutationFunction', userPreferences.toJS());
    return renderRepository.saveUserPreferences(userPreferences);
  };

  const mutation = useMutation({
    mutationFn: saveUserPreferencesMutationFunction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userPreferences'] });
    },
  });

  const _updateUserPreferences = (userPreferences: UserPreferences) => {
    mutation.mutate({ userPreferences });
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
      <Surface shade="light" type="glossy">
        <div className="flex h-full w-full flex-row justify-start align-top">
          <div className="h-full w-[300px]">
            <Surface shade="dark" type="translucent">
              <div className="px-4 py-4">
                <SettingsNav
                  items={state.settingsItems}
                  // activeSettingsItem={activeSettingsItem}
                  onChangeNavItem={_changeActiveSettingItem}
                />
              </div>
            </Surface>
          </div>
          <div className="h-full w-full px-3 py-2 shadow-sm">
            {activeItem && activeItem.key === SettingsKey.SHORTCUTS && (
              <GlobalShortcuts userPreferences={userPreferencesQuery.data} onSave={_updateUserPreferences} />
            )}
            {activeItem && activeItem.key === SettingsKey.APPLICATIONS && <Applications />}
            {activeItem && activeItem.key === SettingsKey.FOCUS_SESSION && <div>Focus Session</div>}
            {activeItem && activeItem.key === SettingsKey.WEBSITE_BLOCKING && <div>Website Blocking</div>}
            {activeItem && activeItem.key === SettingsKey.STORAGE && <div>Storage</div>}
            {activeItem && activeItem.key === SettingsKey.SOUNDS && <div>Sounds</div>}
            {activeItem && activeItem.key === SettingsKey.UPDATES && <div>Updates</div>}
            {activeItem && activeItem.key === SettingsKey.LOGGING && <div>Logging</div>}
            {activeItem && activeItem.key === SettingsKey.ABOUT && <div>About</div>}
          </div>
        </div>
      </Surface>
    </>
  );
}
