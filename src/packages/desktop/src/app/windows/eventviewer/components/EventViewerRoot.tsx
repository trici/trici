import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import log from 'loglevel';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { EventViewerContainer } from './EventViewerContainer';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

export function EventViewerRoot() {
  console.log('EventViewerRoot');
  return (
    <>
      <QueryClientProvider client={queryClient}>
        <EventViewerContainer />
      </QueryClientProvider>
    </>
  );
}

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<EventViewerRoot />);
} else {
  log.error('rootElement is null');
}
