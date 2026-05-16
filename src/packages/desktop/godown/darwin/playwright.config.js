const { defineConfig } = require('@playwright/test');
const { defineBddConfig } = require('playwright-bdd');

const testDir = defineBddConfig({
  features: '__tests__/features/**/*.feature',
  steps: '__tests__/steps/**/*.ts',
  missingSteps: 'skip-scenario',
});

module.exports = defineConfig({
  testDir,
  timeout: 30000,
  expect: {
    timeout: 5000,
  },
  fullyParallel: false,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'html',
  use: {
    actionTimeout: 0,
    trace: 'on-first-retry',
  },
});
