import { OnboardingState, TriciApp } from '@trici/models';

declare global {
  var appDetails: string;
  var installationId: string;
  var triciApp: TriciApp;
  var onboardingState: OnboardingState;
  var userDataDirectoryCheckResult: userDataDirectoryCheckResult;
  var logger: Logger;
  var userPreferences: UserPreferences;
  var config: any;
  var isRunningInAsar: boolean;
}

export {};
