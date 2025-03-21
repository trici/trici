import { getConsoleLogger } from '@trici/logger';
import { SqliteDbManager } from '../src/SqliteDbManager';
import { UsedApplicationRepository } from '../src/UsedApplicationRepository';
import sqlite3 from 'sqlite3';
import { deleteDirectoryWithContents } from '@trici/utils';
import path from 'path';
import fs from 'fs';
import LoggingService from '@trici/logger';
import knexfile from './knex/knexfile';
import { IUsedApplication, UsedAppCategory } from '@trici/models';

describe('UsedApplicationRepository', () => {
  let repository: UsedApplicationRepository;
  let db: sqlite3.Database;
  let dbManager: SqliteDbManager;

  beforeAll(async () => {
    const testDbDirPath = path.join(__dirname, 'testAppData');

    try {
      await deleteDirectoryWithContents(testDbDirPath);

      if (!fs.existsSync(testDbDirPath)) {
        fs.mkdirSync(testDbDirPath, { recursive: true });
      }
    } catch (err) {
      console.log('Error iniitializing logger: ', err);
    }

    try {
      dbManager = new SqliteDbManager(getConsoleLogger);
      await dbManager.init(testDbDirPath, knexfile);
      db = dbManager.getDb();

      repository = new UsedApplicationRepository(db, getConsoleLogger);
    } catch (err) {
      console.log('Error initializing repository: ', err);
    }
  });

  afterAll(async () => {
    await dbManager.close();
  });

  describe('save and getUsedApplications', () => {
    it('should save a used application to the database', async () => {
      const usedApplicationRecord: IUsedApplication = {
        applicationName: 'Test Application',
        appIdentifier: 'com.test.app',
        appCategory: UsedAppCategory.DEFINITELY_WORK,
        durationUsed: 10,
        iconPath: '',
      };

      expect(async () => await repository.save(usedApplicationRecord)).not.toThrow();
    });

    it('should retrieve a used application from the database', async () => {
      const usedApplicationRecord: IUsedApplication = {
        applicationName: 'Test Application',
        appIdentifier: 'com.test.app',
        appCategory: UsedAppCategory.DEFINITELY_WORK,
        durationUsed: 20,
        iconPath: '',
      };

      await repository.save(usedApplicationRecord);

      const fetchedUsedApplicationRecord = await repository.get('Test Application');
      expect(fetchedUsedApplicationRecord).toMatchObject(usedApplicationRecord);
    });

    it('should be able to insert multiple used applications to the database in a single call', async () => {
      const usedApplicationRecord1: IUsedApplication = {
        applicationName: 'Test Application 1',
        appIdentifier: 'com.test.app1',
        appCategory: UsedAppCategory.DEFINITELY_WORK,
        durationUsed: 10,
        iconPath: '',
      };

      const usedApplicationRecord2: IUsedApplication = {
        applicationName: 'Test Application 2',
        appIdentifier: 'com.test.app2',
        appCategory: UsedAppCategory.DEFINITELY_WORK,
        durationUsed: 20,
        iconPath: '',
      };

      const usedApplicationRecord3: IUsedApplication = {
        applicationName: 'Test Application 3',
        appIdentifier: 'com.test.app3',
        appCategory: UsedAppCategory.DEFINITELY_WORK,
        durationUsed: 30,
        iconPath: '',
      };

      const usedApplications = [usedApplicationRecord1, usedApplicationRecord2, usedApplicationRecord3];

      expect(async () => await repository.insertMany(usedApplications)).not.toThrow();
    });
  });
});
