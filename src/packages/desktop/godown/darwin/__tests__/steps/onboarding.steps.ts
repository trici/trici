import { Given, When, Then, expect } from './fixtures';
import type { ElectronApplication, Page } from '@playwright/test';

// ---------------------------------------------------------------------------
// Permission key mapping shared by all steps
// ---------------------------------------------------------------------------

const PERMISSION_KEY: Record<string, string> = {
  'screen recording': 'screenRecording',
  microphone: 'microphone',
  accessibility: 'accessibility',
};

// Steps 2, 3, 4 are permission steps. Navigation through them requires stubbing.
const PERMISSION_AT_STEP: Record<number, string> = {
  2: 'screenRecording',
  3: 'microphone',
  4: 'accessibility',
};

// ---------------------------------------------------------------------------
// Background
// ---------------------------------------------------------------------------

Given('the app is launched for the first time', async ({ onboardingElectronApp }) => {
  // The onboardingElectronApp fixture cleared onboardingState.json before launch,
  // so the app boots into onboarding mode. Nothing more needed here.
});

// ---------------------------------------------------------------------------
// Given — window / wizard state setup
// ---------------------------------------------------------------------------

Given('the onboarding window is open on step 1', async ({ onboardingWindow }) => {
  await onboardingWindow.waitForSelector('#root', { state: 'visible', timeout: 10000 });
});

Given('the onboarding wizard is on step 2', async ({ onboardingWindow, onboardingElectronApp }) => {
  await _navigateToWizardStep(onboardingWindow, onboardingElectronApp, 1);
});

Given(
  /^the onboarding wizard is on the (screen recording|microphone|accessibility) permission step$/,
  async ({ onboardingWindow, onboardingElectronApp }, permission: string) => {
    const stepIndexByPermission: Record<string, number> = {
      'screen recording': 2,
      microphone: 3,
      accessibility: 4,
    };
    await _navigateToWizardStep(onboardingWindow, onboardingElectronApp, stepIndexByPermission[permission]);
  },
);

Given('all required permissions have been granted', async ({ onboardingElectronApp }) => {
  // Stub all three permissions directly in the main process so the wizard steps
  // are immediately marked ready without triggering the macOS permission dialogs.
  await _stubPermissionGranted(onboardingElectronApp, 'screenRecording');
  await _stubPermissionGranted(onboardingElectronApp, 'microphone');
  await _stubPermissionGranted(onboardingElectronApp, 'accessibility');
});

Given('the onboarding wizard is on the work applications step', async ({ onboardingWindow, onboardingElectronApp }) => {
  await _navigateToWizardStep(onboardingWindow, onboardingElectronApp, 5);
});

// ---------------------------------------------------------------------------
// When — actions
// ---------------------------------------------------------------------------

When('the intro animation is playing', async ({ onboardingWindow }) => {
  // Describes a transient state — the forward arrow is hidden while the
  // TriciAnimatedLogo animation runs. The Then assertion verifies the arrow
  // is absent. This step may be timing-sensitive in fast test environments.
});

When('the intro animation has completed', async ({ onboardingWindow }) => {
  // setStepReady(0, true) fires after logoAnimationComplete, which makes the
  // Wizard render the forward arrow.
  await expect(_forwardArrow(onboardingWindow)).toBeVisible({ timeout: 10000 });
});

When('I click the forward arrow', async ({ onboardingWindow }) => {
  await _forwardArrow(onboardingWindow).click();
});

When('I click done', async ({ onboardingWindow }) => {
  await onboardingWindow.getByRole('button', { name: 'Done' }).click();
});

When(
  /^I grant (screen recording|microphone|accessibility) permission$/,
  async ({ onboardingWindow, onboardingElectronApp }, permission: string) => {
    const buttonLabelByPermission: Record<string, string> = {
      'screen recording': 'Grant Screen Recording Permissions',
      accessibility: 'Grant Accessibility Permissions',
      microphone: 'Grant Microphone Permissions',
    };
    // Click the grant button. This sends an IPC to the main process which calls
    // the real macOS permission API (a no-op in test environments).
    await onboardingWindow.getByRole('button', { name: buttonLabelByPermission[permission] }).click();
    // Stub the result: update global.onboardingState and push onboardingStateUpdated
    // to the renderer so the wizard marks this step ready.
    await _stubPermissionGranted(onboardingElectronApp, PERMISSION_KEY[permission]);
  },
);

When('I select one or more applications as work applications', async ({ onboardingWindow }) => {
  // Trigger the fetch if the grid has not loaded yet.
  const fetchButton = onboardingWindow.getByRole('button', { name: 'Fetch Installed Apps' });
  if (await fetchButton.isVisible()) {
    await fetchButton.click();
  }
  // Wait for the MultiSelectGrid, then click at least 3 items.
  // hasChosenWorkApplications requires selectedItems.length > 2.
  const gridItems = onboardingWindow.locator('.flex.flex-wrap.w-full > div');
  await expect(gridItems.first()).toBeVisible({ timeout: 15000 });
  const total = await gridItems.count();
  for (let i = 0; i < Math.min(3, total); i++) {
    await gridItems.nth(i).locator('div').first().click();
  }
});

// ---------------------------------------------------------------------------
// Then — assertions
// ---------------------------------------------------------------------------

Then('the onboarding window should be visible', async ({ onboardingWindow }) => {
  await expect(onboardingWindow.locator('#root')).toBeVisible();
});

Then('the main window should not be visible', async ({ onboardingElectronApp }) => {
  const mainWindow = onboardingElectronApp.windows().find(w => w.url().includes('type=trici'));
  expect(mainWindow).toBeUndefined();
});

Then('the forward arrow should not be visible', async ({ onboardingWindow }) => {
  await expect(_forwardArrow(onboardingWindow)).not.toBeVisible();
});

Then('the forward arrow should be visible', async ({ onboardingWindow }) => {
  await expect(_forwardArrow(onboardingWindow)).toBeVisible();
});

Then('the onboarding wizard should be on step {int}', async ({ onboardingWindow }, stepNumber: number) => {
  // The Wizard renders <div data-stepindex={currentStep}> around the active content.
  // stepNumber is 1-based from the feature file, so subtract 1 for the 0-based index.
  await expect(onboardingWindow.locator(`[data-stepindex="${stepNumber - 1}"]`)).toBeVisible({ timeout: 10000 });
});

Then(
  /^I should see a prompt to grant (screen recording|microphone|accessibility) permission$/,
  async ({ onboardingWindow }, permission: string) => {
    const headingByPermission: Record<string, string> = {
      'screen recording': 'Trici requires your permission to record the screen',
      accessibility: 'Trici requires Accessibility permissions',
      microphone: 'Trici requires Microphone permissions',
    };
    await expect(onboardingWindow.getByText(headingByPermission[permission])).toBeVisible();
  },
);

Then('I should see a list of installed applications', async ({ onboardingWindow }) => {
  const fetchButton = onboardingWindow.getByRole('button', { name: 'Fetch Installed Apps' });
  if (await fetchButton.isVisible()) {
    await fetchButton.click();
  }
  await expect(onboardingWindow.locator('.flex.flex-wrap.w-full')).toBeVisible({ timeout: 15000 });
});

Then('each application should have a selection control', async ({ onboardingWindow }) => {
  // Each item in MultiSelectGrid is a clickable <div> inside a <div class="p-2"> wrapper.
  const gridItems = onboardingWindow.locator('.flex.flex-wrap.w-full > div');
  await expect(gridItems.first()).toBeVisible({ timeout: 15000 });
  expect(await gridItems.count()).toBeGreaterThan(0);
});

Then('the app should restart', async ({ onboardingElectronApp }) => {
  // Completing onboarding calls app.relaunch() + app.exit(0) in the main process.
  await onboardingElectronApp.evaluate(async ({ app }) => {
    return new Promise<void>(resolve => app.once('quit', resolve));
  });
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function _forwardArrow(page: Page) {
  // The Wizard renders an IconButton with aria-label="Next" (useIconButtons=true).
  return page.getByRole('button', { name: 'Next' });
}

/**
 * Stubs a macOS permission as granted by updating global.onboardingState in the
 * main process and pushing an onboardingStateUpdated message directly to the
 * onboarding renderer window.
 *
 * This bypasses the real node-mac-permissions API so tests can run without
 * triggering system permission dialogs.
 */
async function _stubPermissionGranted(electronApp: ElectronApplication, permissionKey: string): Promise<void> {
  const methodsByKey: Record<string, [string, string]> = {
    screenRecording: ['setHasAskedForScreenRecordingPermissions', 'setHasBeenGivenScreenRecordingPermissions'],
    microphone: ['setHasAskedForMicrophonePermissions', 'setHasBeenGivenMicrophonePermissions'],
    accessibility: ['setHasAskedForAccessibilityPermissions', 'setHasBeenGivenAccessibilityPermissions'],
  };
  const [askedMethod, grantedMethod] = methodsByKey[permissionKey];

  await electronApp.evaluate(
    ({ BrowserWindow }, { askedMethod, grantedMethod }) => {
      const updatedState = (global as any).onboardingState[askedMethod]()[grantedMethod]();
      (global as any).onboardingState = updatedState;
      const onboardingWin = BrowserWindow.getAllWindows().find(w =>
        w.webContents.getURL().includes('type=onboarding'),
      );
      if (onboardingWin) {
        onboardingWin.webContents.send('messageFromMain', {
          success: true,
          handler: 'onboardingStateUpdated',
          data: { onboardingState: updatedState.toJS() },
          initValue: false,
        });
      }
    },
    { askedMethod, grantedMethod },
  );
}

/**
 * Navigates the onboarding wizard to a specific 0-based step index.
 *
 * Reads the current step from the DOM so it works correctly when the app is
 * shared across scenarios (worker scope) and is already partway through the
 * onboarding flow. If already at or past the target step, this is a no-op.
 *
 * Steps 2–4 are permission steps: the helper stubs each permission before
 * clicking through it so the forward arrow becomes available without triggering
 * macOS dialogs. The target step itself is NOT stubbed — it is left in the
 * natural "not yet granted" state so scenarios can test the grant flow.
 */
async function _navigateToWizardStep(
  page: Page,
  electronApp: ElectronApplication,
  targetStepIndex: number,
): Promise<void> {
  const attr = await page.locator('[data-stepindex]').getAttribute('data-stepindex');
  const currentStep = attr !== null ? parseInt(attr, 10) : 0;

  for (let i = currentStep; i < targetStepIndex; i++) {
    if (PERMISSION_AT_STEP[i]) {
      await _stubPermissionGranted(electronApp, PERMISSION_AT_STEP[i]);
    }
    await expect(_forwardArrow(page)).toBeVisible({ timeout: 10000 });
    await _forwardArrow(page).click();
    await expect(page.locator(`[data-stepindex="${i + 1}"]`)).toBeVisible({ timeout: 10000 });
  }
}
