import React from 'react';
import { OnboardingState } from '@trici/models';

export type OnboardingContextType = {
  onboardingState: OnboardingState;
  installedApps: { name: string; iconPath: string; bundleIdentifier: string; isBrowser: boolean }[] | [];
};

const OnboardingContext = React.createContext<OnboardingContextType | null>(null);

export const useOnboarding = () => {
  const context = React.useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within a OnboardingContextProvider');
  }
  return context;
};

export default OnboardingContext;
