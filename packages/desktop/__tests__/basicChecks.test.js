const { _electron: electron } = require('playwright');
const { test, expect } = require('@playwright/test');

test.describe('basic checks', () => {

    test('There should be only one instance of the main process', async () => {
        let primaryInstance = await electron.launch({
            args: ['.']
        });
        let primaryInstancePID = primaryInstance.process().pid;
        let secondaryInstancePID;
        try {
            let secondaryInstance = await electron.launch({
                args: ['.']
            });
            secondaryInstancePID = secondaryInstance.process().pid;
        } catch (error) {
          secondaryInstancePID = '';
        }
        expect(primaryInstancePID).not.toBe(secondaryInstancePID);
        expect(secondaryInstancePID).toBe('');
    });
});
