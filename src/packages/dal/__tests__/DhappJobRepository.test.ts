console.log('Executing file DhappJobRepository');
import { Logger } from '@trici/logger';
import { SqliteDbManager } from '../src/SqliteDbManager';
import { DhappJobRepository } from '../src/DhappJobRepository';
import sqlite3 from 'sqlite3';
import { deleteDirectoryWithContents } from '@trici/utils';
import path from 'path';
import fs from 'fs';
import LoggingService from '@trici/logger';
import knexfile from './knex/knexfile';
import { DhappJob } from '../src/DhappJobRepository';

describe('DhappJobRepository', () => {
  let repository: DhappJobRepository;
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
      console.log('Error initializing logger: ', err);
    }

    logger = LoggingService.init(logsDirPath, 'testsql-%DATE%.log', {
      installationId: 'test-installation-id',
      appDetails: 'darwin-dev-2.2.2',
    });
    console.log('Initialized logger');

    try {
      dbManager = new SqliteDbManager(logger);
      await dbManager.init(testDbDirPath, knexfile);
      db = dbManager.getDb();

      repository = new DhappJobRepository(db, logger);
    } catch (err) {
      console.log('Error initializing repository: ', err);
    }
  });

  afterAll(async () => {
    await dbManager.close();
  });

  describe('save and get', () => {
    it('should save a dhapp job to the database', async () => {
      const dhappJobRecord: Omit<DhappJob, 'id' | 'created_at' | 'updated_at'> = {
        job_session_directory: '/test/path',
        status: 'pending',
        steps_completed: { step1: true },
        error_message: null,
        attempt_count: 0,
      };

      expect(async () => await repository.save({ ...dhappJobRecord, id: -1 })).not.toThrow();
    });

    it('should retrieve a dhapp job from the database', async () => {
      const dhappJobRecord: Omit<DhappJob, 'id' | 'created_at' | 'updated_at'> = {
        job_session_directory: '/test/path/2',
        status: 'pending',
        steps_completed: { step1: true },
        error_message: null,
        attempt_count: 0,
      };

      // Insert with id -1 for new record
      await repository.save({ ...dhappJobRecord, id: -1 });

      // Get the inserted record's id
      const result = await new Promise<any>((resolve, reject) => {
        db.get(
          'SELECT id FROM dhapp_job WHERE job_session_directory = ?',
          [dhappJobRecord.job_session_directory],
          (err, row) => {
            if (err) reject(err);
            else resolve(row);
          },
        );
      });

      const fetchedDhappJob = await repository.get(result.id);
      expect(fetchedDhappJob).toMatchObject({
        ...dhappJobRecord,
        id: result.id,
      });
    });

    it('should update an existing dhapp job in the database', async () => {
      const initialDhappJob: Omit<DhappJob, 'id' | 'created_at' | 'updated_at'> = {
        job_session_directory: '/test/path/3',
        status: 'pending',
        steps_completed: { step1: false },
        error_message: null,
        attempt_count: 0,
      };

      // First insert
      await repository.save({ ...initialDhappJob, id: -1 });

      // Get the inserted record's id
      const result = await new Promise<any>((resolve, reject) => {
        db.get(
          'SELECT id FROM dhapp_job WHERE job_session_directory = ?',
          [initialDhappJob.job_session_directory],
          (err, row) => {
            if (err) reject(err);
            else resolve(row);
          },
        );
      });

      // Update the record
      const updatedDhappJob: Omit<DhappJob, 'created_at' | 'updated_at'> = {
        id: result.id,
        job_session_directory: '/test/path/3',
        status: 'completed',
        steps_completed: { step1: true },
        error_message: 'test error',
        attempt_count: 1,
      };

      await repository.save(updatedDhappJob);

      const fetchedDhappJob = await repository.get(result.id);
      expect(fetchedDhappJob).toMatchObject(updatedDhappJob);
    });

    it('should return null for non-existent id', async () => {
      const result = await repository.get(999999);
      expect(result).toBeNull();
    });
  });
});
