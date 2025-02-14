import { Logger } from '@trici/logger';
import sqlite3 from 'sqlite3';

export interface IDhappJob {
  id: number;
  job_session_directory: string;
  job_name: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  steps_completed: Record<string, any>;
  error_message: string | null;
  attempt_count: number;
  created_at: string;
  updated_at: string;
}

export interface IDhappJobRepository {
  save(dhappJob: Omit<IDhappJob, 'created_at' | 'updated_at'>): Promise<IDhappJob>;
  get(id: number): Promise<IDhappJob | null>;
}

export class DhappJobRepository implements IDhappJobRepository {
  db: sqlite3.Database | null = null;
  logger: Logger | null = null;

  constructor(db: sqlite3.Database, logger: Logger) {
    this.db = db;
    this.logger = logger;
  }

  public async save(dhappJob: Omit<IDhappJob, 'created_at' | 'updated_at'>): Promise<IDhappJob> {
    if (!this.db) {
      this.logger?.error('Database not initialized');
      throw new Error('Database not initialized');
    }

    const isInsert = dhappJob.id === -1;
    const query = isInsert
      ? `
        INSERT INTO dhapp_job (
          job_session_directory,
          job_name,
          status,
          steps_completed,
          error_message,
          attempt_count
        ) VALUES (?, ?, ?, ?, ?, ?)
        RETURNING *
      `
      : `
        UPDATE dhapp_job
        SET job_session_directory = ?,
            job_name = ?,
            status = ?,
            steps_completed = ?,
            error_message = ?,
            attempt_count = ?
        WHERE id = ?
        RETURNING *
      `;

    const params = [
      dhappJob.job_session_directory,
      dhappJob.job_name,
      dhappJob.status,
      JSON.stringify(dhappJob.steps_completed),
      dhappJob.error_message,
      dhappJob.attempt_count,
      ...(isInsert ? [] : [dhappJob.id]),
    ];

    return new Promise((resolve, reject) => {
      this.db!.get(query, params, (err, row: any) => {
        if (err) {
          this.logger?.error('Error saving dhapp job to the database', err);
          reject(err);
        } else {
          resolve({
            id: row.id,
            job_session_directory: row.job_session_directory,
            job_name: row.job_name,
            status: row.status,
            steps_completed: JSON.parse(row.steps_completed),
            error_message: row.error_message,
            attempt_count: row.attempt_count,
            created_at: row.created_at,
            updated_at: row.updated_at,
          });
        }
      });
    });
  }

  public async get(id: number): Promise<IDhappJob | null> {
    if (!this.db) {
      this.logger?.error('Database not initialized');
      throw new Error('Database not initialized');
    }

    const selectQuery = `SELECT * FROM dhapp_job WHERE id = ?`;
    const params = [id];

    return new Promise((resolve, reject) => {
      this.db!.get(selectQuery, params, (err, row: any) => {
        if (err) {
          this.logger?.error('Error retrieving dhapp job from the database', err);
          reject(err);
        } else {
          resolve(
            row
              ? {
                  id: row.id,
                  job_session_directory: row.job_session_directory,
                  job_name: row.job_name,
                  status: row.status,
                  steps_completed: JSON.parse(row.steps_completed),
                  error_message: row.error_message,
                  attempt_count: row.attempt_count,
                  created_at: row.created_at,
                  updated_at: row.updated_at,
                }
              : null,
          );
        }
      });
    });
  }
}
