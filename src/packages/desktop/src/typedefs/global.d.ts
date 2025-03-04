import { OnboardingState, TriciApp } from '@trici/models';
import { userDataDirectoryCheckResult } from '@trici/utils';

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
