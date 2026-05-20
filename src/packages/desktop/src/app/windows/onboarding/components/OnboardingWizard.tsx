import { OnboardingState } from '@trici/models';
import OnboardingContext, { OnboardingContextType } from './OnboardingContext';
import React from 'react';
import { Surface, Wizard } from '@singhshashi/proactive';
import OnboardingWizardSteps from './OnboardingWizardSteps';

export interface OnboardingWizardProps {
  onboardingState: OnboardingState;
  installedApps: [{ name: string; iconPath: string; appIdentifier: string; isBrowser: boolean }] | [];
}

const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ onboardingState, installedApps }) => {
  console.log('triciApponboardingWizard', onboardingState);

  const updateOnboardingStateOnStepChange = (stepIndex: number): void => {
    //update the onboardingState.lastOnboardingStep with current stepIndex
    console.log('updateOnboardingStateOnStepChange', stepIndex);
    window.bridgeApi.sendMessage({
      handler: 'updateOnboardingState',
      args: { onboardingState: { ...onboardingState, lastOnboardingStep: stepIndex } },
    });
  };

  const finishOnboarding = (): void => {
    window.bridgeApi.sendMessage({
      handler: 'updateOnboardingState',
      args: { onboardingState: { ...onboardingState, onboardingFinished: true } },
    });
  };

  const onboardingContextValue: OnboardingContextType = {
    onboardingState,
    installedApps: installedApps,
  };

  console.log('onboardingContextValue', onboardingContextValue);
  return (
    <OnboardingContext.Provider value={onboardingContextValue}>
      <Surface shade="light" type="glossy">
        <Wizard
          children={OnboardingWizardSteps}
          width={'720px'}
          height={'540px'}
          startingStep={onboardingState.lastOnboardingStep}
          onFinish={finishOnboarding}
          onStepChange={updateOnboardingStateOnStepChange}
          useIconButtons={true}
        />
      </Surface>
    </OnboardingContext.Provider>
  );
};

export default OnboardingWizard;
