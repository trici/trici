import { Given, When, Then, expect } from './fixtures';
import type { ElectronApplication } from '@playwright/test';

// Menu items captured when the tray is "clicked" — shared within a scenario.
// Safe because workers: 1 and fullyParallel: false guarantee sequential execution.
let capturedMenuLabels: string[] = [];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns the labels of the items currently set on the tray context menu via
 * the test-only main-process hooks installed by InitializationService.
 */
async function _getTrayMenuLabels(electronApp: ElectronApplication): Promise<string[]> {
  return electronApp.evaluate(() => {
    const hooks = (global as any).__triciTestHooks;
    if (!hooks) throw new Error('Trici test hooks are not installed');
    return hooks.getTrayMenuLabels();
  });
}

// ---------------------------------------------------------------------------
// Given — preconditions
// ---------------------------------------------------------------------------

Given('onboarding has been completed', async ({ postOnboardingElectronApp }) => {
  // The postOnboardingElectronApp fixture writes a completed onboarding state
  // file before launching, so the app boots straight into normal mode.
});

Given('the app is running', async ({ postOnboardingElectronApp }) => {
  // Satisfied by the postOnboardingElectronApp fixture being alive.
});

// ---------------------------------------------------------------------------
// When — actions
// ---------------------------------------------------------------------------

When('I click the tray icon', async ({ postOnboardingElectronApp }) => {
  // Native tray clicks cannot be triggered via Playwright. Capture the menu
  // currently attached to Electron's Tray through a test-only main-process hook.
  capturedMenuLabels = await _getTrayMenuLabels(postOnboardingElectronApp);
});

When('I click {string} in the tray menu', async ({ postOnboardingElectronApp }, label: string) => {
  await postOnboardingElectronApp.evaluate(
    ({}, { label }) => {
      const hooks = (global as any).__triciTestHooks;
      if (!hooks) throw new Error('Trici test hooks are not installed');
      hooks.clickTrayMenuItem(label);
    },
    { label },
  );
});

// ---------------------------------------------------------------------------
// Then — assertions
// ---------------------------------------------------------------------------

Then('the tray icon should be visible in the menu bar', async ({ postOnboardingElectronApp }) => {
  // Poll until the tray service has initialised and created the tray icon.
  const deadline = Date.now() + 10000;
  let trayExists = false;
  while (!trayExists && Date.now() < deadline) {
    trayExists = await postOnboardingElectronApp.evaluate(() => {
      const hooks = (global as any).__triciTestHooks;
      if (!hooks) throw new Error('Trici test hooks are not installed');
      return hooks.isTrayVisible();
    });
    if (!trayExists) await new Promise(r => setTimeout(r, 200));
  }
  expect(trayExists).toBe(true);
});

Then('the tray menu should contain {string}', async ({}, label: string) => {
  expect(capturedMenuLabels).toContain(label);
});

Then('the tray menu should not contain {string}', async ({}, label: string) => {
  expect(capturedMenuLabels).not.toContain(label);
});

Then('the Trici window should be visible', async ({ postOnboardingElectronApp }) => {
  let triciWindow = null;
  const deadline = Date.now() + 5000;
  while (!triciWindow && Date.now() < deadline) {
    const windows = postOnboardingElectronApp.windows();
    triciWindow = windows.find(w => w.url().includes('type=trici')) ?? null;
    if (!triciWindow) await new Promise(r => setTimeout(r, 200));
  }
  if (!triciWindow) throw new Error('Trici window did not appear within 5s');
  await triciWindow.waitForLoadState('domcontentloaded', { timeout: 5000 });
  await expect(triciWindow.locator('#root')).toBeVisible();
});

Then('the settings window should be visible', async ({ postOnboardingElectronApp }) => {
  let settingsWindow = null;
  const deadline = Date.now() + 5000;
  while (!settingsWindow && Date.now() < deadline) {
    const windows = postOnboardingElectronApp.windows();
    settingsWindow = windows.find(w => w.url().includes('type=settings')) ?? null;
    if (!settingsWindow) await new Promise(r => setTimeout(r, 200));
  }
  if (!settingsWindow) throw new Error('Settings window did not appear within 5s');
  await settingsWindow.waitForLoadState('domcontentloaded', { timeout: 5000 });
  await expect(settingsWindow.locator('#root')).toBeVisible();
});
