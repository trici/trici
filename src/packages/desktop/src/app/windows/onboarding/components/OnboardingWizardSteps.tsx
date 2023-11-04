import React, { useCallback, useEffect } from 'react';
import { Button, MultiSelectGrid, WizardStep, useWizard } from '@singhshashi/proactive';
import { SimpleVideoClipPlayer } from '../../shared/components/SimpleVideoClipPlayer';
import { useOnboarding } from './OnboardingContext';
import { UsedAppCategory, UsedApplicationRecord } from '@trici/models';
import { TriciAnimatedLogo } from '../../shared/components/TriciAnimatedLogo';

const AskForScreenRecordingPermissionsOnMacComponent: React.FC<{ stepindex: number }> = ({ stepindex }) => {
  const { setStepReady, getStepReady } = useWizard();
  const { onboardingState } = useOnboarding();

  const hasAskedForScreenRecordingPermissions = onboardingState.hasAskedForScreenRecordingPermissions;
  useEffect(() => {
    if (hasAskedForScreenRecordingPermissions) {
      window.bridgeApi.sendMessage({ handler: 'askForScreenRecordingPermissions', args: {} });
    }
  }, [hasAskedForScreenRecordingPermissions]);

  const [screenRecordingPermissionsReceived, setScreenRecordingPermissionsReceived] = React.useState(
    getStepReady(stepindex),
  );

  useEffect(() => {
    const screenRecordingPermissionsStepReady =
      onboardingState.hasAskedForScreenRecordingPermissions && onboardingState.hasBeenGivenScreenRecordingPermissions;
    setStepReady(stepindex, screenRecordingPermissionsStepReady);
  }, [screenRecordingPermissionsReceived, onboardingState]);

  const videoClipUrl = `file://${window.bridgeApi.appPath}/resources/clips/TriciScreenRecordingPermissions_final.mp4`;
  if (onboardingState.hasBeenGivenScreenRecordingPermissions) {
    return (
      <div className="h-full w-full">
        <p className="text-center text-2xl font-bold">Trici requires your permission to record the screen</p>
        <p className="text-center ">All recordings are encrypted and stored locally on your computer.</p>
        <div className="flex h-full w-full flex-col items-center justify-evenly">
          <div className="m-0 w-fit">
            <SimpleVideoClipPlayer clipUrl={videoClipUrl} />
          </div>
          <div className="m-0 w-full text-center">
            <p className="text-xl font-bold">Screen Recording Permissions Granted</p>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="h-full w-full">
      <p className="text-center text-2xl font-bold">Trici requires your permission to record the screen</p>
      <p className="text-center ">All recordings are encrypted and stored locally on your computer.</p>
      <div className="flex h-full w-full flex-col items-center justify-evenly">
        <div className="m-0 w-fit">
          <SimpleVideoClipPlayer clipUrl={videoClipUrl} />
        </div>
        <div className="m-0 w-full text-center">
          <Button
            variant="primary"
            size="medium"
            onClick={() => {
              console.log('Asking for Screen Recording Permissions for the first time');
              window.bridgeApi.sendMessage({ handler: 'askForScreenRecordingPermissions', args: {} });
            }}
          >
            Grant Screen Recording Permissions
          </Button>
        </div>
      </div>
    </div>
  );
};

const TriciFirstWelcomeComponent: React.FC<{ stepindex: number }> = ({ stepindex }) => {
  const { setStepReady, getStepReady } = useWizard();

  const [stepAnimationComplete, setStepAnimationComplete] = React.useState(false);
  const [logoAnimationComplete, setLogoAnimationComplete] = React.useState(false);

  useEffect(() => {
    if (logoAnimationComplete) {
      setStepAnimationComplete(true);
    }
  }, [logoAnimationComplete]);

  useEffect(() => {
    setStepReady(stepindex, stepAnimationComplete);
  }, [stepAnimationComplete]);

  return (
    <div className="h-full w-full ">
      <div className="flex h-full w-full flex-col items-center justify-evenly ">
        <div className="h-[350px] w-[350px] text-center text-white">
          <TriciAnimatedLogo onAnimationComplete={() => setLogoAnimationComplete(true)} />
        </div>
        <div className="h-[50px] text-center">
          {logoAnimationComplete && (
            <>
              <div className="text-xl font-bold">Trici is an AI powered productivity tool for developers.</div>
              <br />
              <div className="text-xl font-bold">Let's get you set up!</div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
const TriciFirstWelcomeStep = () => {
  return (
    <WizardStep stepindex={0}>
      <TriciFirstWelcomeComponent stepindex={0} />
    </WizardStep>
  );
};

const InformUserAboutRequiredPermissionsStep = () => {
  const illustrationUrl = `file://${window.bridgeApi.appPath}/resources/images/undraw_switches.svg`;
  return (
    <WizardStep stepindex={1}>
      <div className="h-full w-full">
        <div className="flex h-full w-full flex-col items-center justify-evenly ">
          <div className="h-[350px] w-[350px] text-center text-white">
            <img src={illustrationUrl} alt="welcome" />
          </div>
          <div className="text-xl font-bold">Trici requires certain permissions to provide its core functionality.</div>
          <div className="text-xl">Please grant these permissions in the following steps to use Trici.</div>
        </div>
      </div>
    </WizardStep>
  );
};
const AskForScreenRecordingPermissionsOnMacStep = () => {
  return (
    <WizardStep stepindex={2}>
      <AskForScreenRecordingPermissionsOnMacComponent stepindex={1} />
    </WizardStep>
  );
};

const AskWhichAreWorkAppsComponent: React.FC<{ stepindex: number }> = ({ stepindex }) => {
  const { setStepReady, getStepReady } = useWizard();
  const { onboardingState, installedApps } = useOnboarding();

  const [workAppsChosen, setWorkAppsChosen] = React.useState(getStepReady(stepindex));
  const [isFetching, setIsFetching] = React.useState(false);

  useEffect(() => {
    const workAppsStepReady = onboardingState.hasChosenWorkApplications;
    setStepReady(stepindex, workAppsStepReady);
  }, [workAppsChosen, onboardingState]);

  useEffect(() => {
    if (installedApps.length > 0) {
      setIsFetching(false);
    }
  }, [installedApps]);

  const getUsedApplications = (
    installedApps: [{ name: string; iconPath: string }] | [],
    selectedItems: [{ name: string; iconPath: string }],
  ): Array<UsedApplicationRecord> | [] => {
    let usedApplications: Array<UsedApplicationRecord> = [];
    if (installedApps.length === 0) {
      return usedApplications;
    }
    installedApps.forEach((installedApp: { name: string; iconPath: string }) => {
      const usedApplicationRecord: UsedApplicationRecord = {
        applicationName: installedApp.name,
        iconPath: installedApp.iconPath,
        durationUsed: 0,
        appCategory: UsedAppCategory.NOT_SET,
      };
      usedApplications.push(usedApplicationRecord);
    });
    selectedItems.forEach((selectedItem: { name: string; iconPath: string }) => {
      const usedApplicationRecord = usedApplications.find(
        (usedApplicationRecord: UsedApplicationRecord) => usedApplicationRecord.applicationName === selectedItem.name,
      );
      if (usedApplicationRecord) {
        usedApplicationRecord.appCategory = UsedAppCategory.DEFINITELY_WORK;
      }
    });
    return usedApplications;
  };

  const handleSelectionChange = useCallback(
    (selectedItems): void => {
      const usedApplications = getUsedApplications(installedApps, selectedItems);
      window.bridgeApi.sendMessage({
        handler: 'updateUsedApplications',
        args: { usedApplications: usedApplications },
      });
      setWorkAppsChosen(selectedItems.length > 2);
      if (selectedItems.length > 2) {
        window.bridgeApi.sendMessage({
          handler: 'updateOnboardingState',
          args: {
            onboardingState: {
              ...onboardingState,
              hasChosenWorkApplications: selectedItems.length > 2,
            },
          },
        });
      }
    },
    [installedApps],
  );
  return (
    <div className="h-full w-full">
      <div className="text-center text-xl">
        <p className="font-bold">Which of these are your work apps?</p>
        <p className="">Select all that apply (Choose at least three)</p>
      </div>
      <div className="flex h-full w-full flex-col items-center justify-start gap-5">
        <div className="text-center text-xl"></div>
        {installedApps.length > 0 && (
          <div className="h-[400px] overflow-y-scroll text-center">
            <MultiSelectGrid
              data={installedApps}
              itemTemplate={(item: { name: string; iconPath: string }) => {
                return (
                  <div className="flex h-full flex-col justify-around gap-2">
                    <div className="">
                      <img className="mx-auto h-8 w-8 rounded-full" src={item.iconPath} alt={item.name} />
                    </div>
                    <div className="text-sm">{item.name}</div>
                  </div>
                );
              }}
              onSelectionChange={handleSelectionChange}
            />
          </div>
        )}
        {installedApps.length === 0 && (
          <div className="text-xl">
            {!isFetching && (
              <Button
                variant="primary"
                size="medium"
                onClick={() => {
                  console.log('Fetching Installed Apps');
                  setIsFetching(true);
                  window.bridgeApi.sendMessage({ handler: 'fetchInstalledApps', args: {} });
                }}
              >
                Fetch Installed Apps
              </Button>
            )}{' '}
            {isFetching && <p>Fetching Installed Apps ...</p>}
          </div>
        )}
      </div>
    </div>
  );
};

const AskWhichAreWorkAppsStep = () => {
  return (
    <WizardStep stepindex={3}>
      <AskWhichAreWorkAppsComponent stepindex={2} />
    </WizardStep>
  );
};

const SuccessfullyFinishedInitialSetupStep = () => {
  const illustrationUrl = `file://${window.bridgeApi.appPath}/resources/images/undraw_happy_news.svg`;
  return (
    <WizardStep stepindex={4}>
      <div className="h-full w-full">
        <div className="flex h-full w-full flex-col items-center justify-evenly ">
          <div className="h-[350px] w-[350px] text-center text-white">
            <img src={illustrationUrl} alt="finished" className="h-[350px] w-[350px]" />
          </div>
          <div className="text-xl font-bold">Trici is now ready to use!</div>
        </div>
      </div>
    </WizardStep>
  );
};

const OnboardingWizardSteps = [
  <TriciFirstWelcomeStep key="step0" />,
  <InformUserAboutRequiredPermissionsStep key="step1" />,
  <AskForScreenRecordingPermissionsOnMacStep key="step2" />,
  <AskWhichAreWorkAppsStep key="step3" />,
  <SuccessfullyFinishedInitialSetupStep key="step4" />,
];

export default OnboardingWizardSteps;
