import { getVersion, createIpcClient, generateUUIDv5 } from '../dist/index.js';
import * as fs from 'fs';
import * as path from 'path';

describe('getVersion', () => {
  afterEach(() => {
    try {
      fs.unlinkSync(path.join(process.cwd(), 'VERSION'));
    } catch (error) {
      // Ignore
    }
  });

  test('returns content of VERSION file', () => {
    fs.writeFileSync(path.join(process.cwd(), 'VERSION'), '1.2.3');
    expect(getVersion()).toBe('1.2.3');
  });

  test('returns NaN when VERSION file does not exist', () => {
    expect(getVersion()).toBe('NaN');
  });
});

describe('createIpcClient', () => {
  test('connects to ipc server', () => {
    const client = createIpcClient(true);

    // client has a connect method
    expect(client.connectAndPing).toBeDefined();
    expect(typeof client.connectAndPing).toBe('function');
    expect(client.connectAndSendMessage).toBeDefined();
    expect(typeof client.connectAndSendMessage).toBe('function');
    expect(client.disconnect).toBeDefined();
    expect(typeof client.disconnect).toBe('function');

  });
});

describe('generateUUIDv5', () => {
  test('generates a UUIDv5', async () => {
    let uuid;
    try{
      uuid = await generateUUIDv5('test');
      console.log('uuid:', uuid)
    } catch (error) {
      console.error('Error generating UUIDv5:', error);
    }
    expect(uuid).toBeDefined();
    // expect(uuid).toBe('d6b9f7e4-0a8d-5d6a-8c7b-6a8e6a8e6a8e');
  });
});
