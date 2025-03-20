import { getConsoleLogger } from '@trici/logger';
import { deleteDirectoryWithContents } from '@trici/utils';
import { SqliteDbManager } from '../src/SqliteDbManager';
import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import knexfile from './knex/knexfile';

let dbManager: SqliteDbManager;

export async function beforeAllInitCommon() {
  let db: sqlite3.Database;

  const testDbDirPath = path.join(__dirname, 'testAppData');
  await deleteDirectoryWithContents(testDbDirPath);

  if (!fs.existsSync(testDbDirPath)) {
    fs.mkdirSync(testDbDirPath, { recursive: true });
  }

  dbManager = new SqliteDbManager(getConsoleLogger);

  const dbDirPath = path.join(__dirname, 'testAppData');

  try {
    await dbManager.init(dbDirPath, knexfile);
  } catch (err) {
    console.log('Error initializing dbManager: ', err);
  }
  db = dbManager.getDb();

  return {
    db,
  };
}

export async function afterAllInitCommon() {
  await dbManager.close();
}
