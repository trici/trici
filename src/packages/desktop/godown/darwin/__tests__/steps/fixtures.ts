import { test as base, createBdd } from 'playwright-bdd';
import { _electron as electron, expect } from '@playwright/test';
import type { ElectronApplication, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { execFile } from 'child_process';
import { promisify } from 'util';

const APP_PATH = '/Applications/TriciTest.app/Contents/MacOS/TriciTest';
const APP_PROCESS_NAME = 'TriciTest';
const execFileAsync = promisify(execFile);
const TEST_APP_ENV = { ...process.env, BUILD_ENV: 'test' };

// Electron's userData path on macOS is ~/Library/Application Support/<app.getName()>.
// The installed app name is 'TriciTest'; the package name ('trici-test') is used for
// Chromium's process-singleton lock which lives in a separate directory.
const ONBOARDING_STATE_PATH = path.join(
  os.homedir(),
  'Library',
  'Application Support',
  'TriciTest',
  'onboardingState.json',
);

// Chromium's SingletonLock file, keyed by the package name rather than the app name.
// Electron holds this lock while running to prevent duplicate instances.
const SINGLETON_LOCK_PATH = path.join(
  os.homedir(),
  'Library',
  'Application Support',
  'trici-test',
  'SingletonLock',
);

const test = base.extend<
  { appWindow: Awaited<ReturnType<ElectronApplication['firstWindow']>> },
  {
    electronApp: ElectronApplication;
    onboardingElectronApp: ElectronApplication;
    postOnboardingElectronApp: ElectronApplication;
    onboardingWindow: Awaited<ReturnType<ElectronApplication['firstWindow']>>;
  }
>({
  electronApp: [
    async ({}, use: (r: ElectronApplication) => Promise<void>) => {
      const app = await launchTestApp();
      try {
        await use(app);
      } finally {
        await closeElectronApp(app);
      }
    },
    { scope: 'worker' },
  ],

  // Launches the app after onboarding has been completed by the onboarding test
  // suite (01_onboarding.feature). Feature files run in alphabetical order so
  // onboarding always runs first, leaving the state file in place.
  //
  // Why we kill the relaunched process and delete SingletonLock before launching:
  // The onboarding flow ends with app.relaunch() + app.exit(0). The original
  // process exits and a new process (the relaunched app) starts. Playwright has
  // no handle to that relaunched process, so we cannot quit it gracefully via
  // the Playwright API. We send SIGTERM to stop it, then also delete the
  // SingletonLock as a safety net in case Electron didn't have time to clean it
  // up before the signal was processed.
  postOnboardingElectronApp: [
    async ({}, use: (r: ElectronApplication) => Promise<void>) => {
      await killRelaunchedApp();
      const app = await launchTestApp();
      try {
        await use(app);
      } finally {
        await closeElectronApp(app);
      }
    },
    { scope: 'worker' },
  ],

  // Single app instance shared across all scenarios. The state file is cleared
  // once before launch so the app always starts onboarding from the beginning.
  // Worker scope means the app is launched once per test-worker and stays open
  // for the duration of the entire test suite.
  onboardingElectronApp: [
    async ({}, use: (r: ElectronApplication) => Promise<void>) => {
      try {
        fs.unlinkSync(ONBOARDING_STATE_PATH);
      } catch (e) {
        // File may not exist on a clean machine — that's fine.
      }
      const app = await launchTestApp();
      try {
        await use(app);
      } finally {
        await closeElectronApp(app);
      }
    },
    { scope: 'worker' },
  ],

  appWindow: async ({ electronApp }: { electronApp: ElectronApplication }, use: (r: Page) => Promise<void>) => {
    const window = await electronApp.firstWindow();
    await window.waitForLoadState('domcontentloaded', { timeout: 15000 });
    await window.waitForSelector('#root', { state: 'visible', timeout: 15000 });
    await use(window);
  },

  // Returns the onboarding BrowserWindow. Worker-scoped so the same window
  // object is reused across all scenarios without reopening the app.
  onboardingWindow: [
    async ({ onboardingElectronApp }: { onboardingElectronApp: ElectronApplication }, use: (r: Page) => Promise<void>) => {
      let onboarding: Page | null = null;
      const deadline = Date.now() + 15000;
      while (!onboarding && Date.now() < deadline) {
        const windows = onboardingElectronApp.windows();
        onboarding = windows.find((w: Page) => w.url().includes('type=onboarding')) ?? null;
        if (!onboarding) await new Promise(r => setTimeout(r, 200));
      }
      if (!onboarding) throw new Error('Onboarding window did not appear within 15s');
      await onboarding.waitForLoadState('domcontentloaded', { timeout: 15000 });
      await onboarding.waitForSelector('#root', { state: 'visible', timeout: 15000 });
      await use(onboarding);
    },
    { scope: 'worker' },
  ],
});

const { Given, When, Then } = createBdd(test);

async function launchTestApp(): Promise<ElectronApplication> {
  return electron.launch({ executablePath: APP_PATH, env: TEST_APP_ENV });
}

async function closeElectronApp(app: ElectronApplication): Promise<void> {
  try {
    await app.close();
  } catch (e) {
    // The onboarding flow may already have quit the original process.
  }
}

// Kills the app process that was relaunched at the end of onboarding, then
// removes the SingletonLock as a safety net in case Electron didn't clean it
// up before exiting. Without this, postOnboardingElectronApp cannot launch.
async function killRelaunchedApp(): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 1000));
  try {
    await execFileAsync('pkill', ['-x', APP_PROCESS_NAME]);
    await new Promise(resolve => setTimeout(resolve, 500));
  } catch (e) {
    // pkill exits non-zero when no matching process is found — that's fine.
  }
  try {
    fs.unlinkSync(SINGLETON_LOCK_PATH);
  } catch (e) {
    // Lock may not exist if the process exited cleanly and removed it itself.
  }
}

export { test, Given, When, Then, expect, ONBOARDING_STATE_PATH };
