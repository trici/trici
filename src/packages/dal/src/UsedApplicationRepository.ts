import { UsedApplication, IUsedApplication } from '@trici/models';
import sqlite3 from 'sqlite3';
import { Logger } from '@trici/logger';
import { error } from 'console';

export interface IUsedApplicationRepository {
  save(usedApplication: IUsedApplication): Promise<void>;
  get(applicationName: string): Promise<IUsedApplication | null>;
  insertMany(usedApplications: IUsedApplication[]): Promise<void>;
  getUsedApplications(): Promise<IUsedApplication[]>;
}

export class UsedApplicationRepository implements IUsedApplicationRepository {
  private db: sqlite3.Database | null = null;
  private logger: Logger | null = null;

  constructor(db: sqlite3.Database, logger: Logger) {
    this.db = db;
    this.logger = logger;
  }

  // Insert or update the used application
  public async save(usedApplication: IUsedApplication): Promise<void> {
    if (!this.db) {
      this.logger?.error('Database not initialized');
      throw new Error('Database not initialized');
    }
    const insertQuery = `INSERT OR REPLACE INTO used_application (application_name, app_identifier, app_category, duration_used, icon_path) VALUES (?, ?, ?, ?, ?)`;
    const params = [
      usedApplication.applicationName,
      usedApplication.appIdentifier,
      usedApplication.appCategory,
      usedApplication.durationUsed,
      usedApplication.iconPath,
    ];

    return new Promise((resolve, reject) => {
      this.db!.run(insertQuery, params, err => {
        if (err) {
          this.logger?.error('Error saving used application to the database', err);
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  // Given that I have now added the appIdentifier to the IUsedApplication interface, I am not sure if this method is needed.
  public async get(applicationName: string): Promise<IUsedApplication | null> {
    if (!this.db) {
      this.logger?.error('Database not initialized');
      throw new Error('Database not initialized');
    }
    const selectQuery = `SELECT * FROM used_application WHERE application_name = ?`;
    const params = [applicationName];

    return new Promise((resolve, reject) => {
      this.db!.all(selectQuery, params, (err, rows: any[]) => {
        if (err) {
          this.logger?.error('Error retrieving used application from the database', err);
          reject(err);
        } else {
          if (rows.length === 0) {
            return null;
          }
          if (rows.length > 1) {
            this.logger?.error('Error retrieving used application from the database. More than one record found');
            throw new Error('Error retrieving used application from the database. More than one record found');
          }
          const usedApplicationsResult = rows[0];
          resolve({
            applicationName: usedApplicationsResult.application_name,
            appIdentifier: usedApplicationsResult.app_identifier,
            appCategory: usedApplicationsResult.app_category,
            durationUsed: usedApplicationsResult.duration_used,
            iconPath: usedApplicationsResult.icon_path,
          });
        }
      });
    });
  }

  // Insert multiple records at once.
  public async insertMany(usedApplications: IUsedApplication[]): Promise<void> {
    if (!this.db) {
      this.logger?.error('Database not initialized');
      throw new Error('Database not initialized');
    }
    return new Promise((resolve, reject) => {
      this.db!.run('BEGIN TRANSACTION;');
      const insertQuery = `INSERT INTO used_application (application_name, app_identifier, app_category, duration_used, icon_path) VALUES (?, ?, ?, ?, ?)`;
      const statement = this.db!.prepare(insertQuery);

      for (const usedApplication of usedApplications) {
        statement.run(
          usedApplication.applicationName,
          usedApplication.appIdentifier,
          usedApplication.appCategory,
          usedApplication.durationUsed,
          usedApplication.iconPath,
        );
      }
      statement.finalize();
      this.db!.run('COMMIT;', error => {
        if (error) {
          this.logger?.error('Error inserting used application into the database', error);
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  public async getUsedApplications(): Promise<IUsedApplication[]> {
    if (!this.db) {
      this.logger?.error('Database not initialized');
      throw new Error('Database not initialized');
    }
    return new Promise((resolve, reject) => {
      const query = `SELECT * FROM used_application`;
      this.db!.all(query, (error, rows: any[]) => {
        if (error) {
          this.logger?.error('Error retrieving used applications from the database', error);
          reject(error);
        } else {
          //transform rows into fields of IUsedApplication
          const usedApplications: IUsedApplication[] = rows.map(row => {
            return {
              applicationName: row.application_name,
              appIdentifier: row.app_identifier,
              appCategory: row.app_category,
              durationUsed: row.duration_used,
              iconPath: row.icon_path,
            };
          });
          resolve(usedApplications);
        }
      });
    });
  }
}
