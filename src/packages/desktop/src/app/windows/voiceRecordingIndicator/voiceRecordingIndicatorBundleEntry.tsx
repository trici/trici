import ReactDOM from 'react-dom/client';
import { VoiceRecordingIndicator } from '../shared/components/VoiceRecordingIndicator';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import log from 'loglevel';

const queryClient = new QueryClient();

function VoiceRecordingIndicatorRoot() {
  return (
    <QueryClientProvider client={queryClient}>
      <VoiceRecordingIndicator />
    </QueryClientProvider>
  );
}

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<VoiceRecordingIndicatorRoot />);
} else {
  log.error('rootElement is null');
}
