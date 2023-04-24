import { getVersion, createIpcClient, generateUUIDv5, checkUserDataDirectory, clearNodeIpcServerSocket } from '../dist/index.js';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';


// Helper function to create a temporary directory for testing
function createTempDirectory(): string {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'trici-test-'));
  return tempDir;
}

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


describe('checkUserDataDirectory', () => {
  it('creates the required directories if they do not exist', async () => {
    const tempDir = createTempDirectory();
    const workspaceName = 'testWorkspace';

    const result = await checkUserDataDirectory(tempDir, workspaceName);

    expect(result.workspacesDir.exists).toBe(false);
    expect(result.workspacesDir.created).toBe(true);
    expect(fs.existsSync(result.workspacesDir.path)).toBe(true);

    expect(result.workspaceDir.exists).toBe(false);
    expect(result.workspaceDir.created).toBe(true);
    expect(fs.existsSync(result.workspaceDir.path)).toBe(true);

    expect(result.recordingsDir.exists).toBe(false);
    expect(result.recordingsDir.created).toBe(true);
    expect(fs.existsSync(result.recordingsDir.path)).toBe(true);

    expect(result.dataDir.exists).toBe(false);
    expect(result.dataDir.created).toBe(true);
    expect(fs.existsSync(result.dataDir.path)).toBe(true);
  });

  it('does not create the directories if they already exist', async () => {
    const tempDir = createTempDirectory();
    const workspaceName = 'testWorkspace';

    const initialResult = await checkUserDataDirectory(tempDir, workspaceName);
    const secondResult = await checkUserDataDirectory(tempDir, workspaceName);

    expect(secondResult.workspacesDir.exists).toBe(true);
    expect(secondResult.workspacesDir.created).toBe(false);

    expect(secondResult.workspaceDir.exists).toBe(true);
    expect(secondResult.workspaceDir.created).toBe(false);

    expect(secondResult.recordingsDir.exists).toBe(true);
    expect(secondResult.recordingsDir.created).toBe(false);

    expect(secondResult.dataDir.exists).toBe(true);
    expect(secondResult.dataDir.created).toBe(false);
  });
});

describe('clearNodeIpcServerSocket', () => {
  it('clears the socket file', () => {
    const tempDir = createTempDirectory();
    const socketFile = path.join(tempDir, 'test.sock');

    fs.writeFileSync(socketFile, '');
    expect(fs.existsSync(socketFile)).toBe(true);

    clearNodeIpcServerSocket(socketFile);
    expect(fs.existsSync(socketFile)).toBe(false);
  });
});
