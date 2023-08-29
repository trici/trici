const { _electron: electron } = require('playwright');
const { test, expect } = require('@playwright/test');
const { createIpcClient } = require('@trici/utils');

test.describe('Single Instance Checks', () => {
  let primaryInstance;

  test.beforeAll(async () => {
    primaryInstance = await electron.launch({
      args: ['.'],
      env: {
        NODE_ENV: 'test',
      },
    });
  });

  test('There should be only one instance of the main process', async () => {
    let primaryInstancePID = primaryInstance.process().pid;
    console.log('Primary instance PID:', primaryInstancePID);
    let secondaryInstancePID;
    try {
      let secondaryInstance = await electron.launch({
        args: ['.'],
      });
      console.log('Secondary instance PID:', secondaryInstance.process().pid);
      secondaryInstancePID = secondaryInstance.process().pid;
    } catch (error) {
      secondaryInstancePID = '';
    }
    expect(primaryInstancePID).not.toBe(secondaryInstancePID);
    expect(secondaryInstancePID).toBe('');
  });
  test('The primary instance should have registered as a primary instance', async () => {
    test.setTimeout(5000);
    // Check that there is an IPC server serving at the unix socket.
    const client = createIpcClient();
    console.log('Ipc client config:', client.getConfig());
    try {
      const resp = await client.connectAndPing();
      expect(resp.type).toBe('pong');
      client.disconnect();
    } catch (error) {
      console.log(error);
      expect(error).toBe(null);
    }
  });

  test.afterAll(async () => {
    await primaryInstance.close();
  });
});
