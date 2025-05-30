import { IConsoleLogger, Logger } from '@trici/logger';
import sqlite3 from 'sqlite3';
import { DhappJobType } from '@trici/models';

export interface IDhappJob {
  id: number;
  job_session_directory: string;
  job_name: string;
  job_type: DhappJobType;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  failure_type: 'fatal' | 'retryable' | 'skipped' | 'max_retries_exceeded' | 'none';
  steps_completed: Record<string, any>;
  error_message: string | null;
  attempt_count: number;
  created_at: string;
  updated_at: string;
}

export interface IDhappJobRepository {
  save(dhappJob: Omit<IDhappJob, 'created_at' | 'updated_at'>): Promise<IDhappJob>;
  get(id: number): Promise<IDhappJob | null>;
  getJobToHandle(): Promise<IDhappJob | null>;
  getOneFailedJob(): Promise<IDhappJob | null>;
}

export class DhappJobRepository implements IDhappJobRepository {
  db: sqlite3.Database | null = null;
  getLogger: () => Logger | IConsoleLogger;

  constructor(db: sqlite3.Database, getLogger: () => Logger | IConsoleLogger) {
    this.db = db;
    this.getLogger = getLogger;
  }

  public async getJobToHandle(): Promise<IDhappJob | null> {
    const query = `SELECT * FROM dhapp_job WHERE status IN ('pending', 'processing') ORDER BY created_at ASC LIMIT 1`;
    const params: any[] = [];
    return new Promise((resolve, reject) => {
      this.db!.get(query, params, (err, row: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(
            row
              ? {
                  id: row.id,
                  job_session_directory: row.job_session_directory,
                  job_name: row.job_name,
                  job_type: row.job_type,
                  status: row.status,
                  steps_completed: JSON.parse(row.steps_completed),
                  error_message: row.error_message,
                  attempt_count: row.attempt_count,
                  created_at: row.created_at,
                  updated_at: row.updated_at,
                  failure_type: row.failure_type,
                }
              : null,
          );
        }
      });
    });
  }

  public async save(dhappJob: Omit<IDhappJob, 'created_at' | 'updated_at'>): Promise<IDhappJob> {
    if (!this.db) {
      this.getLogger().error('Database not initialized');
      throw new Error('Database not initialized');
    }

    const isInsert = dhappJob.id === -1;
    const query = isInsert
      ? `
        INSERT INTO dhapp_job (
          job_session_directory,
          job_name,
          job_type,
          status,
          steps_completed,
          error_message,
          attempt_count,
          failure_type
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        RETURNING *
      `
      : `
        UPDATE dhapp_job
        SET job_session_directory = ?,
            job_name = ?,
            job_type = ?,
            status = ?,
            steps_completed = ?,
            error_message = ?,
            attempt_count = ?,
            failure_type = ?
        WHERE id = ?
        RETURNING *
      `;

    const params = [
      dhappJob.job_session_directory,
      dhappJob.job_name,
      dhappJob.job_type,
      dhappJob.status,
      JSON.stringify(dhappJob.steps_completed),
      dhappJob.error_message,
      dhappJob.attempt_count,
      dhappJob.failure_type,
      ...(isInsert ? [] : [dhappJob.id]),
    ];

    return new Promise((resolve, reject) => {
      this.db!.get(query, params, (err, row: any) => {
        if (err) {
          this.getLogger().error('Error saving dhapp job to the database', err);
          reject(err);
        } else {
          resolve({
            id: row.id,
            job_session_directory: row.job_session_directory,
            job_name: row.job_name,
            job_type: row.job_type,
            status: row.status,
            steps_completed: JSON.parse(row.steps_completed),
            error_message: row.error_message,
            attempt_count: row.attempt_count,
            created_at: row.created_at,
            updated_at: row.updated_at,
            failure_type: row.failure_type,
          });
        }
      });
    });
  }

  public async get(id: number): Promise<IDhappJob | null> {
    if (!this.db) {
      this.getLogger().error('Database not initialized');
      throw new Error('Database not initialized');
    }

    const selectQuery = `SELECT * FROM dhapp_job WHERE id = ?`;
    const params = [id];

    return new Promise((resolve, reject) => {
      this.db!.get(selectQuery, params, (err, row: any) => {
        if (err) {
          this.getLogger().error('Error retrieving dhapp job from the database', err);
          reject(err);
        } else {
          resolve(
            row
              ? {
                  id: row.id,
                  job_session_directory: row.job_session_directory,
                  job_name: row.job_name,
                  job_type: row.job_type,
                  status: row.status,
                  steps_completed: JSON.parse(row.steps_completed),
                  error_message: row.error_message,
                  attempt_count: row.attempt_count,
                  created_at: row.created_at,
                  updated_at: row.updated_at,
                  failure_type: row.failure_type,
                }
              : null,
          );
        }
      });
    });
  }

  public async getOneFailedJob(): Promise<IDhappJob | null> {
    const query = `SELECT * FROM dhapp_job WHERE status = 'failed' AND failure_type = 'retryable' ORDER BY created_at ASC LIMIT 1`;
    const params: any[] = [];
    return new Promise((resolve, reject) => {
      this.db!.get(query, params, (err, row: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(
            row
              ? {
                  id: row.id,
                  job_session_directory: row.job_session_directory,
                  job_name: row.job_name,
                  job_type: row.job_type,
                  status: row.status,
                  steps_completed: JSON.parse(row.steps_completed),
                  error_message: row.error_message,
                  attempt_count: row.attempt_count,
                  created_at: row.created_at,
                  updated_at: row.updated_at,
                  failure_type: row.failure_type,
                }
              : null,
          );
        }
      });
    });
  }
}
