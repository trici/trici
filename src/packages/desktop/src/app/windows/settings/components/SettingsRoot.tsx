import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { MantineProvider, Grid } from '@mantine/core';
import { SettingsContainer } from './SettingsContainer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { IMessageFromMain } from '../../../../typedefs/preload';
import { SettingsKey } from '../typedefs/SettingsWindowTypes';
import log from 'loglevel';

const queryClient = new QueryClient();

function SettingsRoot() {
  const initValues = window.bridgeApi.getInitValues();
  let activeSettingsItem = SettingsKey.SHORTCUTS;
  if (initValues) {
    const openSettingsSectionMessage = initValues.find(
      (value: IMessageFromMain) => value.handler === 'openSettingsSection',
    );
    if (openSettingsSectionMessage) {
      activeSettingsItem = openSettingsSectionMessage.data.section;
    }
  }
  return (
    <MantineProvider withGlobalStyles withNormalizeCSS>
      <QueryClientProvider client={queryClient}>
        <SettingsContainer activeSettingsItem={activeSettingsItem} />
      </QueryClientProvider>
    </MantineProvider>
  );
}
const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<SettingsRoot />);
} else {
  log.error('rootElement is null');
}
