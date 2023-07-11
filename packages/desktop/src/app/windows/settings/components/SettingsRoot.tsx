import React from 'react';
import ReactDOM from 'react-dom/client';
import { MantineProvider, Grid } from '@mantine/core';
import { SettingsContainer } from './SettingsContainer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

function SettingsRoot() {
  return (
    <MantineProvider withGlobalStyles withNormalizeCSS>
      <QueryClientProvider client={queryClient}>
        <SettingsContainer />
      </QueryClientProvider>
    </MantineProvider>
  );
}
const rootElement = document.getElementById('root');
if (rootElement) {
const root = ReactDOM.createRoot(rootElement);
root.render(<SettingsRoot />);
} else {
  console.log('rootElement is null');
}
