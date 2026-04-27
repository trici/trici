const { _electron: electron } = require('@playwright/test');
const { test, expect } = require('@playwright/test');
const path = require('path');

let electronApp;
let window;

test.describe('Trici Launch and Onboarding', () => {
  test.beforeAll(async () => {
    const appPath = '/Applications/TriciTest.app/Contents/MacOS/TriciTest';

    try {
      // Launch the app
      electronApp = await electron.launch({
        executablePath: appPath
      });

      // Get the first window and wait for it to be ready
      window = await electronApp.firstWindow();

      // Wait for the window to be loaded with a timeout
      await window.waitForLoadState('domcontentloaded', { timeout: 10000 });

      // Wait for the root element to be visible
      await window.waitForSelector('#root', {
        state: 'visible',
        timeout: 10000
      });
    } catch (error) {
      console.error('Failed to launch app:', error);
      throw error;
    }
  });

  test.afterAll(async () => {
    if (electronApp) {
      await electronApp.close();
    }
  });

  test('should have root element visible', async () => {
    const rootElement = await window.$('#root');
    expect(rootElement).toBeTruthy();
  });
});
