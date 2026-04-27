import { UserPreferences } from '@trici/models';

export enum SettingsKey {
  SHORTCUTS = 'Shortcuts',
  SCREEN_TO_RECORD = 'Screen to Record',
  APPLICATIONS = 'Applications',
  FOCUS_SESSION = 'Focus Session',
  WEBSITE_BLOCKING = 'Website Blocking',
  STORAGE = 'Storage',
  SOUNDS = 'Sounds',
  UPDATES = 'Updates',
  LOGGING = 'Logging',
  ABOUT = 'About',
}

export interface ISettingsItem {
  key: SettingsKey;
  label: string;
  icon: string;
  isActive: boolean;
}

export interface ISettingsNavProps {
  items: ISettingsItem[];
  onChangeNavItem: (key: SettingsKey) => void;
}

export interface ISettingsItemComponentProps {
  userPreferences: UserPreferences | undefined;
  onSave: (updatedUserPreferences: UserPreferences) => void;
}

export interface IConfigureGlobalShortcutProps {
  label: string;
  currentShortcut: string | undefined;
  onShortcutChange: (shortcut: string) => void;
  defaultShortcut: string;
}

export interface IConfigureGlobalShortcutState {
  shortcut: string;
  isShortcutValid: boolean; //should include the case where the shortcut is already in use
}
