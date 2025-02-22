console.log('Executing file DhappJobRepository');
import { Logger } from '@trici/logger';
import { SqliteDbManager } from '../src/SqliteDbManager';
import { DhappJobRepository, IDhappJob } from '../src/DhappJobRepository';
import sqlite3 from 'sqlite3';
import { deleteDirectoryWithContents } from '@trici/utils';
import path, { resolve } from 'path';
import fs from 'fs';
import LoggingService from '@trici/logger';
import knexfile from './knex/knexfile';

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
      const dhappJobRecord: Omit<IDhappJob, 'id' | 'created_at' | 'updated_at'> = {
        job_session_directory: '/test/path/1739194174072',
        job_name: '1739194174072',
        status: 'pending',
        steps_completed: { step1: true },
        error_message: null,
        attempt_count: 0,
      };

      expect(async () => await repository.save({ ...dhappJobRecord, id: -1 })).not.toThrow();
    });

    it('should return the job to handle when there is a pending job', async () => {
      const jobToHandle = await repository.getJobToHandle();
      expect(jobToHandle).not.toBeNull();
      expect(jobToHandle?.status).toBe('pending');
      expect(jobToHandle?.job_session_directory).toBe('/test/path/1739194174072');
      expect(jobToHandle?.job_name).toBe('1739194174072');
    });

    it('should retrieve a dhapp job from the database', async () => {
      const dhappJobRecord: Omit<IDhappJob, 'id' | 'created_at' | 'updated_at'> = {
        job_session_directory: '/test/path/1739194174073',
        job_name: '1739194174073',
        status: 'pending',
        steps_completed: { step1: true },
        error_message: null,
        attempt_count: 0,
      };

      // Insert with id -1 for new record
      const savedJob = await repository.save({ ...dhappJobRecord, id: -1 });

      const fetchedDhappJob = await repository.get(savedJob.id);
      expect(fetchedDhappJob).toMatchObject({
        ...dhappJobRecord,
        id: savedJob.id,
      });
    });

    it('should update an existing dhapp job in the database', async () => {
      const initialDhappJob: Omit<IDhappJob, 'id' | 'created_at' | 'updated_at'> = {
        job_session_directory: '/test/path/1739194174074',
        status: 'pending',
        steps_completed: { step1: false },
        error_message: null,
        attempt_count: 0,
        job_name: '1739194174074',
      };
      // First insert
      const savedJob = await repository.save({
        ...initialDhappJob,
        id: -1,
        job_session_directory: initialDhappJob.job_session_directory,
        status: initialDhappJob.status,
        steps_completed: initialDhappJob.steps_completed,
        error_message: initialDhappJob.error_message,
        attempt_count: initialDhappJob.attempt_count,
        job_name: '1739194174074',
      });

      // Update the record
      const updatedDhappJob: Omit<IDhappJob, 'created_at' | 'updated_at'> = {
        id: savedJob.id,
        job_session_directory: savedJob.job_session_directory,
        status: 'completed',
        steps_completed: { step1: true },
        error_message: 'test error',
        attempt_count: 1,
        job_name: savedJob.job_name,
      };

      await repository.save(updatedDhappJob);

      const fetchedDhappJob = await repository.get(savedJob.id);
      expect(fetchedDhappJob).toMatchObject(updatedDhappJob);
    });

    it('should return null for non-existent id', async () => {
      const result = await repository.get(999999);
      expect(result).toBeNull();
    });
  });
});
