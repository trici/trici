import { IAppEvent, TriciAppEvent } from '@trici/models';
import sqlite3 from 'sqlite3';
import { IConsoleLogger, Logger } from '@trici/logger';

export interface IAppEventRepository {
  save(tapEvent: IAppEvent): Promise<void>;
  getAppEvents(from: number, to: number, type: TriciAppEvent | null, count: number): Promise<Array<IAppEvent>>;
  getAllAppEvents(from: number, to: number): Promise<Array<IAppEvent>>;
}

export class AppEventRepository implements IAppEventRepository {
  db: sqlite3.Database | null = null;
  getLogger: () => Logger | IConsoleLogger;

  constructor(db: sqlite3.Database, getLogger: () => Logger | IConsoleLogger) {
    this.db = db;
    this.getLogger = getLogger;
  }
  getAllAppEvents(from: number, to: number): Promise<Array<IAppEvent>> {
    if (!this.db) {
      this.getLogger().error('Database not initialized');
      throw new Error('Database not initialized');
    }

    const selectQuery = `SELECT * FROM app_event WHERE timestamp BETWEEN ? AND ?`;
    const params: any[] = [from, to];
    return new Promise((resolve, reject) => {
      this.db!.all(selectQuery, params, (err, rows: any[]) => {
        if (err) {
          this.getLogger().error('Error retrieving app events from the database', err);
          reject(err);
        } else {
          resolve(
            rows.map(row => ({
              id: row.id,
              type: row.type,
              timestamp: row.timestamp,
              data: JSON.parse(row.data) as Array<any>,
            })),
          );
        }
      });
    });
  }

  public async getAppEventsForSession(sessionId: string): Promise<Array<IAppEvent>> {
    if (!this.db) {
      this.getLogger().error('Database not initialized');
      throw new Error('Database not initialized');
    }

    const selectQuery = `SELECT * FROM app_event WHERE session_id = ?`;
    const params: any[] = [sessionId];

    return new Promise((resolve, reject) => {
      this.db!.all(selectQuery, params, (err, rows: any[]) => {
        if (err) {
          this.getLogger().error('Error retrieving app events from the database', err);
          reject(err);
        } else {
          resolve(
            rows.map(row => ({
              id: row.id,
              type: row.type,
              timestamp: row.timestamp,
              data: JSON.parse(row.data) as Array<any>,
            })),
          );
        }
      });
    });
  }

  public async save(tapEvent: IAppEvent): Promise<void> {
    if (!this.db) {
      this.getLogger().error('Database not initialized');
      throw new Error('Database not initialized');
    }

    const insertQuery = `INSERT INTO app_event (id, type, timestamp, data) VALUES (?, ?, ?, ?)`;
    const params = [tapEvent.id, tapEvent.type, tapEvent.timestamp, JSON.stringify(tapEvent.data)];

    return new Promise((resolve, reject) => {
      this.db!.run(insertQuery, params, err => {
        if (err) {
          this.getLogger().error('Error saving app event to the database', err);
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  public async getAppEvents(
    from: number,
    to: number,
    type: TriciAppEvent | null,
    count: number = 200,
  ): Promise<Array<IAppEvent>> {
    if (!this.db) {
      this.getLogger().error('Database not initialized');
      throw new Error('Database not initialized');
    }

    let selectQuery = `SELECT * FROM app_event WHERE timestamp BETWEEN ? AND ? ORDER BY timestamp DESC`;
    const params: any[] = [from, to];

    if (type !== null) {
      selectQuery += ` AND type = ?`;
      params.push(type as string);
    }

    selectQuery += ` LIMIT ?`;
    params.push(count);

    return new Promise((resolve, reject) => {
      this.db!.all(selectQuery, params, (err, rows: any[]) => {
        if (err) {
          this.getLogger().error('Error retrieving app events from the database', err);
          reject(err);
        } else {
          resolve(
            rows.map(row => ({
              id: row.id,
              type: row.type,
              timestamp: row.timestamp,
              data: JSON.parse(row.data) as Array<any>,
            })),
          );
        }
      });
    });
  }
}
