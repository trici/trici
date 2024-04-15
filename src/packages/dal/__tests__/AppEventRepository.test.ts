import { AppEventRepository } from '../src/AppEventRepository';
import { SqliteDbManager } from '../src/SqliteDbManager';
import sqlite3 from 'sqlite3';
import type { Logger } from '@trici/logger';
import LoggingService from '@trici/logger';
import { IAppEvent, TRICI_APP_EVENT } from '@trici/models';
import path from 'path';
import { deleteDirectoryWithContents } from '@trici/utils';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import knexfile from './knex/knexfile';

describe('AppEventRepository', () => {
  let repository: AppEventRepository;
  let db: sqlite3.Database;
  let logger: Logger;
  let dbManager: SqliteDbManager;

  beforeAll(async () => {
    const logsDirPath = path.join(__dirname, 'logs');
    const testDbDirPath = path.join(__dirname, 'testAppData');

    try {
      console.log('Cleaning test logs directory');
      await deleteDirectoryWithContents(logsDirPath);
      console.log('Cleaned test logs directory');
      console.log('Cleaning test db directory');
      await deleteDirectoryWithContents(testDbDirPath);

      if (!fs.existsSync(testDbDirPath)) {
        fs.mkdirSync(testDbDirPath, { recursive: true });
        console.log('Test db directory created');
      }
    } catch (err) {
      console.log('Error iniitializing logger: ', err);
    }

    // Assuming you have a test database setup for this purpose
    logger = LoggingService.init(logsDirPath, 'testsql-%DATE%.log', {
      installationId: 'test-installation-id',
      appDetails: 'darwin-dev-2.2.2',
    });

    dbManager = new SqliteDbManager(logger);

    const dbDirPath = path.join(__dirname, 'testAppData');

    try {
      await dbManager.init(dbDirPath, knexfile);
    } catch (err) {
      console.log('Error initializing dbManager: ', err);
    }
    db = dbManager.getDb();

    repository = new AppEventRepository(db, logger);
  });

  afterAll(async () => {
    await dbManager.close();
  });

  describe('save and getAppEvents', () => {
    it('should save a tap event to the database', async () => {
      const tapEvent: IAppEvent = {
        id: uuidv4(),
        type: TRICI_APP_EVENT.FRONTMOST_APP_CHANGED,
        timestamp: Date.now(),
        data: [
          {
            frontmostApp: 'Code',
            previousFrontmostApp: 'Terminal',
            previousAppActiveTime: 210,
          },
        ],
      };

      expect(async () => await repository.save(tapEvent)).not.toThrow();
    });

    it('should retrieve tap events from the database', async () => {
      const from = Date.now() - 10000; // 10 seconds ago
      const to = Date.now();
      const type = TRICI_APP_EVENT.FRONTMOST_APP_CHANGED; // Assuming an event type

      const events = await repository.getAppEvents(from, to, type);

      console.log('retrieved events', events);
      expect(events).toHaveLength(1);
      const retrievedEvent = events[0];
      expect(retrievedEvent.type).toEqual(TRICI_APP_EVENT.FRONTMOST_APP_CHANGED);

      // Verify the events are retrieved correctly
      // This could include checking the length of the events array and properties of the events
    });
  });
});
