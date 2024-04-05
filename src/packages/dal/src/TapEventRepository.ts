import { ITapEvent, TRICI_APP_EVENT } from '@trici/models';
import sqlite3 from 'sqlite3';
import { Logger } from '@trici/logger';

export interface ITapEventRepository {
  save(tapEvent: ITapEvent): Promise<void>;
  getTapEvents(from: number, to: number, type: TRICI_APP_EVENT): Promise<Array<ITapEvent>>;
}

export class TapEventRepository implements ITapEventRepository {
  db: sqlite3.Database | null = null;
  logger: Logger | null = null;

  constructor(db: sqlite3.Database, logger: Logger) {
    this.db = db;
    this.logger = logger;
  }

  public async save(tapEvent: ITapEvent): Promise<void> {
    if (!this.db) {
      this.logger?.error('Database not initialized');
      throw new Error('Database not initialized');
    }

    const insertQuery = `INSERT INTO app_event (id, type, timestamp, data) VALUES (?, ?, ?, ?)`;
    const params = [tapEvent.id, tapEvent.type, tapEvent.timestamp, JSON.stringify(tapEvent.data)];

    return new Promise((resolve, reject) => {
      this.db!.run(insertQuery, params, err => {
        if (err) {
          this.logger?.error('Error saving app event to the database', err);
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  public async getTapEvents(from: number, to: number, type: TRICI_APP_EVENT): Promise<Array<ITapEvent>> {
    if (!this.db) {
      this.logger?.error('Database not initialized');
      throw new Error('Database not initialized');
    }

    const selectQuery = `SELECT * FROM app_event WHERE timestamp BETWEEN ? AND ? AND type = ?`;
    const params = [from, to, type];

    return new Promise((resolve, reject) => {
      this.db!.all(selectQuery, params, (err, rows: ITapEvent[]) => {
        if (err) {
          this.logger?.error('Error retrieving app events from the database', err);
          reject(err);
        } else {
          resolve(
            rows.map(row => ({
              id: row.id,
              type: row.type,
              timestamp: row.timestamp,
              data: JSON.parse(row.data),
            })),
          );
        }
      });
    });
  }
}
