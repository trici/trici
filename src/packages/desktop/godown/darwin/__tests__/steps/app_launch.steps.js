const { Given, Then, expect } = require('./fixtures');

Given('the TriciTest app is launched', async ({ electronApp }) => {
  // App is launched via the electronApp fixture
});

Then('the main window should be visible', async ({ appWindow }) => {
  const root = await appWindow.$('#root');
  expect(root).toBeTruthy();
});
