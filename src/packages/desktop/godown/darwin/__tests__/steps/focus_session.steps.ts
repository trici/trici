import { Given, Then } from './fixtures';
import type { ElectronApplication } from '@playwright/test';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function _isFocusSessionInProgress(electronApp: ElectronApplication): Promise<boolean> {
  return electronApp.evaluate(() => {
    const hooks = (global as any).__triciTestHooks;
    if (!hooks) throw new Error('Trici test hooks are not installed');
    return hooks.isFocusSessionInProgress();
  });
}

async function _waitForSessionState(
  electronApp: ElectronApplication,
  expectedInProgress: boolean,
  timeoutMs = 10000,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if ((await _isFocusSessionInProgress(electronApp)) === expectedInProgress) return;
    await new Promise(r => setTimeout(r, 200));
  }
  throw new Error(`Focus session did not reach inProgress=${expectedInProgress} within ${timeoutMs}ms`);
}

async function _clickTrayMenuItemViaHook(electronApp: ElectronApplication, label: string): Promise<void> {
  await electronApp.evaluate(
    ({}, { label }) => {
      const hooks = (global as any).__triciTestHooks;
      if (!hooks) throw new Error('Trici test hooks are not installed');
      hooks.clickTrayMenuItem(label);
    },
    { label },
  );
}

// ---------------------------------------------------------------------------
// Given — preconditions
// ---------------------------------------------------------------------------

Given('a focus session is in progress', async ({ postOnboardingElectronApp }) => {
  if (await _isFocusSessionInProgress(postOnboardingElectronApp)) return;
  await _clickTrayMenuItemViaHook(postOnboardingElectronApp, 'Start Focus Session');
  await _waitForSessionState(postOnboardingElectronApp, true);
});

// Backdates the current session start time rather than sleeping 15 s.
Given('the session has been running for at least 15 seconds', async ({ postOnboardingElectronApp }) => {
  await postOnboardingElectronApp.evaluate(() => {
    const hooks = (global as any).__triciTestHooks;
    if (!hooks) throw new Error('Trici test hooks are not installed');
    hooks.backdateCurrentSession(16000);
  });
});

Given('a focus session has just ended', async ({ postOnboardingElectronApp }) => {
  if (!(await _isFocusSessionInProgress(postOnboardingElectronApp))) {
    await _clickTrayMenuItemViaHook(postOnboardingElectronApp, 'Start Focus Session');
    await _waitForSessionState(postOnboardingElectronApp, true);
  }
  await _clickTrayMenuItemViaHook(postOnboardingElectronApp, 'Stop Session');
  await _waitForSessionState(postOnboardingElectronApp, false);
});

// ---------------------------------------------------------------------------
// Then — assertions
// ---------------------------------------------------------------------------

Then('a focus session should be in progress', async ({ postOnboardingElectronApp }) => {
  await _waitForSessionState(postOnboardingElectronApp, true);
});

Then('the focus session should have ended', async ({ postOnboardingElectronApp }) => {
  await _waitForSessionState(postOnboardingElectronApp, false);
});
