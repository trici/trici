import React from 'react';
import ReactDOM from 'react-dom/client';
import log from 'loglevel';
import { HiddenTitleBar } from '../../shared/components/HiddenTitleBar';
import OnboardingWizard from './OnboardingWizard';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { IMessageFromMain } from '../../../../typedefs/preload';
import { OnboardingState } from '@trici/models';
import { useEffect } from 'react';

// import classes from './OnboardingRoot.module.css';

const queryClient = new QueryClient();

export function OnboardingRoot() {
  const initValues = window.bridgeApi.getInitValues();
  let onboardingStateInit = new OnboardingState();
  if (initValues) {
    console.log('initValues', initValues);
    const onboardingStateInitMessage = initValues.find(
      (value: IMessageFromMain) => value.handler === 'onboardingStateInit',
    );
    if (onboardingStateInitMessage) {
      onboardingStateInit = onboardingStateInitMessage.data.onboardingState;
    }
  }
  const [onboardingState, setOnboardingState] = React.useState(onboardingStateInit);
  const [installedApps, setInstalledApps] = React.useState<
    [{ name: string; iconPath: string; bundleIdentifier: string; isBrowser: boolean }] | []
  >([]);

  useEffect(() => {
    window.bridgeApi.registerReceiveHandlers(
      'OnboardingRoot',
      response => {
        if (response.handler === 'onboardingStateUpdated') {
          console.log('onboardingStateUpdated', response.data.onboardingState);
          setOnboardingState(response.data.onboardingState);
        }
        if (response.handler === 'installedAppsReceived') {
          console.log('installedAppsReceived', response.data.installedApps);
          setInstalledApps(response.data.installedApps);
        }
      },
      ['onboardingStateUpdated', 'installedAppsReceived'],
    );
  });

  console.log('onboardingStateOnboardingRoot:', onboardingState);
  return (
    <div className="bg-gradient-to-t from-gray-50 to-gray-100">
      <HiddenTitleBar />
      <main className="h-screen p-4">
        <OnboardingWizard onboardingState={onboardingState} installedApps={installedApps} />
      </main>
    </div>
  );
}

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<OnboardingRoot />);
} else {
  log.error('rootElement is null');
}
