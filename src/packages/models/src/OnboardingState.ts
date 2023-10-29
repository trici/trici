import * as Immutable from 'immutable';

export interface IOnboardingState {
  onboardingFinished: boolean;
  lastOnboardingStep: number;
  hasAskedForScreenRecordingPermissions: boolean;
  hasBeenGivenScreenRecordingPermissions: boolean;
  hasChosenWorkApplications: boolean;
}

const OnboardingStateRecord = Immutable.Record({
  onboardingFinished: false,
  lastOnboardingStep: 0,
  hasAskedForScreenRecordingPermissions: false,
  hasBeenGivenScreenRecordingPermissions: false,
  hasChosenWorkApplications: false,
});

/**
 * The OnboardingState model.
 * @description The OnboardingState model is used to track the onboarding state of the app. It is saved not in the database, but in a JSON file.
 * It is saved using AppJsonStorageService.
 */
export class OnboardingState extends OnboardingStateRecord implements IOnboardingState {
  constructor(onboardingState?: OnboardingState) {
    if (typeof onboardingState === 'undefined' || onboardingState === null) {
      super({
        onboardingFinished: false,
        lastOnboardingStep: 0,
        hasAskedForScreenRecordingPermissions: false,
        hasBeenGivenScreenRecordingPermissions: false,
        hasChosenWorkApplications: false,
      });
    } else {
      super({
        onboardingFinished: onboardingState.onboardingFinished,
        lastOnboardingStep: onboardingState.lastOnboardingStep,
        hasAskedForScreenRecordingPermissions: onboardingState.hasAskedForScreenRecordingPermissions,
        hasBeenGivenScreenRecordingPermissions: onboardingState.hasBeenGivenScreenRecordingPermissions,
        hasChosenWorkApplications: onboardingState.hasChosenWorkApplications,
      });
    }
  }
  setHasAskedForScreenRecordingPermissions(): OnboardingState {
    return this.set('hasAskedForScreenRecordingPermissions', true);
  }
  setHasBeenGivenScreenRecordingPermissions(): OnboardingState {
    return this.set('hasBeenGivenScreenRecordingPermissions', true);
  }
}
