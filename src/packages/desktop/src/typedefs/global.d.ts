import type { OnboardingState, TriciApp } from '@trici/models';
import type { Logger } from '@trici/logger';
import type { userDataDirectoryCheckResult } from '@trici/utils';

export interface TriciTestHooks {
  isTrayVisible(): boolean;
  getTrayMenuLabels(): string[];
  clickTrayMenuItem(label: string): void;
  isFocusSessionInProgress(): boolean;
  backdateCurrentSession(msBack: number): void;
}

declare global {
  var appDetails: string;
  var installationId: string;
  var triciApp: TriciApp;
  var onboardingState: OnboardingState;
  var userDataDirectoryCheckResult: userDataDirectoryCheckResult;
  var logger: Logger;
  var userPreferences: any;
  var config: any;
  var isRunningInAsar: boolean;
  var __triciTestHooks: TriciTestHooks | undefined;
}

export {};
