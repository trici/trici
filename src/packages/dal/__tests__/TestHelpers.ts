import LoggingService from '@trici/logger';
import { deleteDirectoryWithContents } from '@trici/utils';
import { SqliteDbManager } from '../src/SqliteDbManager';
import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import knexfile from './knex/knexfile';
import { Logger } from '@trici/logger';

let dbManager: SqliteDbManager;

export async function beforeAllInitCommon() {
  let db: sqlite3.Database;
  let logger: Logger;

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

  return {
    db,
    logger,
  };
}

export async function afterAllInitCommon() {
  await dbManager.close();
}
