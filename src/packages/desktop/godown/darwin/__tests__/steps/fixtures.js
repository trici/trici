const { test: base, expect } = require('@playwright/test');
const { _electron: electron } = require('@playwright/test');
const { createBdd } = require('playwright-bdd');

const APP_PATH = '/Applications/TriciTest.app/Contents/MacOS/TriciTest';

const test = base.extend({
  electronApp: async ({}, use) => {
    const app = await electron.launch({ executablePath: APP_PATH });
    await use(app);
    await app.close();
  },

  appWindow: async ({ electronApp }, use) => {
    const window = await electronApp.firstWindow();
    await window.waitForLoadState('domcontentloaded', { timeout: 15000 });
    await window.waitForSelector('#root', { state: 'visible', timeout: 15000 });
    await use(window);
  },
});

const { Given, When, Then } = createBdd(test);

module.exports = { test, Given, When, Then, expect };
