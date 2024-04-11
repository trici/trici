import { Logger } from '@trici/logger';
import knex from 'knex';
//@ts-ignore
import sqlite3 from 'sqlite3';
import path from 'path';

export interface ISqliteDbManager {
  init(dataDirectoryPath: string, knexfile: any): void;
  isInitialized(): boolean;
  getDb(): sqlite3.Database;
  close(): Promise<void>;
}

export class SqliteDbManager implements ISqliteDbManager {
  #dbInitialized: boolean;
  db: sqlite3.Database | null;
  #logger: Logger;
  knexInstance: any;

  constructor(logger: Logger) {
    this.#dbInitialized = false;
    this.db = null;
    this.knexInstance = null;
    this.#logger = logger;
  }

  /**
   * Initializes the repository.
   * @param dataDirectoryPath The path to the data directory. This should include the workspace and the app name.
   * @example dataDirectoryPath = /Users/username/Library/Application Support/Trici/MyWorkspace/data
   *
   */
  public async init(dataDirectoryPath: string, knexfile: any): Promise<void> {
    if (!this.#dbInitialized) {
      try {
        const dbPath = path.join(dataDirectoryPath, 'trici.db');
        this.db = new sqlite3.Database(dbPath);
        this.#dbInitialized = true;
        const knexConfig = knexfile[process.env.NODE_ENV || 'development'];
        knexConfig.connection.filename = dbPath;
        console.log('knexConfig in init: ', knexConfig);
        this.knexInstance = knex(knexConfig);
        const [batchno, migrations] = await this.knexInstance.migrate.latest();
        if (migrations.length === 0) {
          this.#logger.info('No migrations ran');
        } else {
          this.#logger.info(`Migrations ran successfully: ${batchno}, ${migrations}`);
        }
      } catch (err) {
        this.#logger.error(`Error initializing Sqlite3 database: `, err);
        console.error(err);
        throw err;
      }
    }
  }

  public isInitialized(): boolean {
    return this.#dbInitialized;
  }

  public getDb(): sqlite3.Database {
    if (!this.#dbInitialized || !this.db) {
      throw new Error('Database not initialized');
    }
    return this.db;
  }

  public async close(): Promise<void> {
    if (this.#dbInitialized && this.db !== null) {
      try {
        await this.db.close();
        this.knexInstance.destroy();
        this.#dbInitialized = false;
        this.#logger.info('Database connection closed successfully.');
      } catch (err) {
        this.#logger.error('Error closing the database connection: ', err);
        console.error(err);
        throw err;
      }
    } else {
      this.#logger.warn('Attempted to close a database connection that was not initialized.');
    }
  }
}
