import { FocusSession, IFocusSession } from '@trici/models';
import sqlite3 from 'sqlite3';
import { Logger } from '@trici/logger';

export interface IFocusSessionRepository {
  save(focusSession: IFocusSession): Promise<IFocusSession>;
  get(id: number): Promise<IFocusSession | null>;
  getFocusSessions(from: number, to: number): Promise<Array<IFocusSession>>;
}

export class FocusSessionRepository implements IFocusSessionRepository {
  db: sqlite3.Database | null = null;
  logger: Logger | null = null;

  constructor(db: sqlite3.Database, logger: Logger) {
    this.db = db;
    this.logger = logger;
  }

  private mapRowToFocusSession(row: any): IFocusSession {
    return new FocusSession({
      id: row.id,
      startTime: row.start_time,
      endTime: row.end_time,
      name: row.name,
      sessionDidStart: row.session_did_start,
      recordingProcessCrashedOnStart: row.recording_process_crashed_on_start,
      displayUnits: JSON.parse(row.display_units),
      shouldHaveRecording: row.should_have_recording,
      startedBy: row.started_by,
      startedFrom: row.started_from,
      sessionStartMetadata: JSON.parse(row.session_start_metadata),
    });
  }

  async save(focusSession: FocusSession): Promise<IFocusSession> {
    // If focus session is new, insert it
    // If focus session is existing, update it
    if (!this.db) {
      this.logger?.error('Database not initialized');
      throw new Error('Database not initialized');
    }

    if (focusSession.id && focusSession.id > 0) {
      // Update
      const updateQuery = `UPDATE focus_session SET start_time = ?, end_time = ?, name = ?, session_did_start = ?, recording_process_crashed_on_start = ?,
       display_units = ?, should_have_recording = ?, started_by = ?, started_from = ?, session_start_metadata = ? WHERE id = ? RETURNING *`;
      const params = [
        focusSession.startTime,
        focusSession.endTime,
        focusSession.name,
        focusSession.sessionDidStart,
        focusSession.recordingProcessCrashedOnStart,
        JSON.stringify(focusSession.displayUnits),
        focusSession.shouldHaveRecording,
        focusSession.startedBy,
        focusSession.startedFrom,
        JSON.stringify(focusSession.sessionStartMetadata),
        focusSession.id,
      ];
      return new Promise((resolve, reject) => {
        this.db!.get(updateQuery, params, (err, row: any) => {
          if (err) {
            this.logger?.error('Error updating focus session', err);
            reject(err);
          } else {
            resolve(this.mapRowToFocusSession(row));
          }
        });
      });
    } else {
      // Insert
      const insertQuery = `INSERT INTO focus_session (start_time, end_time, name, session_did_start, recording_process_crashed_on_start, display_units, should_have_recording, started_by, started_from, session_start_metadata) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *`;
      const params = [
        focusSession.startTime,
        focusSession.endTime,
        focusSession.name,
        focusSession.sessionDidStart,
        focusSession.recordingProcessCrashedOnStart,
        JSON.stringify(focusSession.displayUnits),
        focusSession.shouldHaveRecording,
        focusSession.startedBy,
        focusSession.startedFrom,
        JSON.stringify(focusSession.sessionStartMetadata),
      ];
      return new Promise((resolve, reject) => {
        this.db!.get(insertQuery, params, (err, row: any) => {
          if (err) {
            this.logger?.error('Error inserting focus session', err);
            reject(err);
          } else {
            resolve(this.mapRowToFocusSession(row));
          }
        });
      });
    }
  }

  async get(id: number): Promise<IFocusSession | null> {
    if (!this.db) {
      this.logger?.error('Database not initialized');
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      this.db!.get(`SELECT * FROM focus_session WHERE _id = ? `, [id], (err, row) => {
        if (err) {
          this.logger?.error('Error getting focus session', err);
          reject(err);
        } else {
          if (!row) resolve(null);
          else resolve(this.mapRowToFocusSession(row));
        }
      });
    });
  }

  public async getFocusSessions(from: number, to: number): Promise<Array<IFocusSession>> {
    if (!this.db) {
      this.logger?.error('Database not initialized');
      throw new Error('Database not initialized');
    }

    const selectQuery = `SELECT * FROM focus_session WHERE start_time BETWEEN ? AND ?`;
    const params: any[] = [from, to];

    return new Promise((resolve, reject) => {
      this.db!.all(selectQuery, params, (err, rows) => {
        if (err) {
          this.logger?.error('Error getting focus sessions', err);
          reject(err);
        } else {
          resolve(rows.map(this.mapRowToFocusSession));
        }
      });
    });
  }
}
