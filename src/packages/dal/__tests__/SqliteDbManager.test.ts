import { SqliteDbManager } from '../src/SqliteDbManager';
import path from 'path';
import { deleteDirectoryWithContents } from '@trici/utils';
import { getConsoleLogger } from '@trici/logger';
import knexfile from './knex/knexfile';

describe('SqliteDbManager', () => {
  let dbManager: SqliteDbManager | undefined;

  const appDataDirectory = path.join(__dirname, 'testAppData');
  const workspaceName = 'default';

  beforeAll(async () => {
    dbManager = new SqliteDbManager(getConsoleLogger);
    // Init will create the db with tables
    try {
      await dbManager.init(appDataDirectory, knexfile);
    } catch (err) {
      console.log('Error initializing dbManager: ', err);
      throw err;
    }
  });

  afterAll(async () => {
    dbManager = undefined;
  });

  test('dbManager should be initialized', async () => {
    if (dbManager) {
      expect(dbManager).toBeDefined();
      const dbInitialized = dbManager.isInitialized();
      expect(dbInitialized).toBe(true);
    }
  });

  test('dbManager should have a db property', async () => {
    if (dbManager) {
      const db = dbManager.getDb();
      expect(db).toBeDefined();
    }
  });

  test('dbManager should close the connection without error', async () => {
    if (dbManager) {
      await dbManager.close();
      const dbInitialized = dbManager.isInitialized();
      expect(dbInitialized).toBe(false);
    }
  });
});
