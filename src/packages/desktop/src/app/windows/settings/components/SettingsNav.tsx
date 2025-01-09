import * as React from 'react';
import { ISettingsNavProps } from '../typedefs/SettingsWindowTypes';
import { SideNav, NavItem } from '@singhshashi/proactive';

export const SettingsNav: React.FC<ISettingsNavProps> = ({ items, onChangeNavItem }) => {
  const handleSideNavSelectionChange = (selectedItem: NavItem): void => {
    // get the SettingsKey from selectedItem
    let selectedSetting = items.find(item => item.key === selectedItem.key);
    if (selectedSetting === undefined) {
      selectedSetting = items[0];
    }
    onChangeNavItem(selectedSetting.key);
  };

  const navItems: NavItem[] = [];
  items.forEach(item => {
    navItems.push({
      key: item.key,
      label: item.label,
      icon: item.icon,
      isSelected: item.isActive,
    });
  });

  return <SideNav items={navItems} onSelectionChange={handleSideNavSelectionChange} />;
};
