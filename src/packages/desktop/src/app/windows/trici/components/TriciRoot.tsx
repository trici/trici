import ReactDOM from 'react-dom/client';
// import { MantineProvider, Grid } from '@mantine/core';
import { TriciContainer } from './TriciContainer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { IMessageFromMain } from '../../../../typedefs/preload';
import log from 'loglevel';
// import { triciThemeOverride } from '../../shared/themes';

const queryClient = new QueryClient();

function TriciRoot() {
  return (
    <QueryClientProvider client={queryClient}>
      <TriciContainer />
    </QueryClientProvider>
  );
}
const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<TriciRoot />);
} else {
  log.error('rootElement is null');
}
