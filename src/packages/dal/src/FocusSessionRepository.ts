import { FocusSession, IFocusSession } from '@trici/models';
import sqlite3 from 'sqlite3';
import { IConsoleLogger, Logger } from '@trici/logger';

export interface IFocusSessionRepository {
  save(focusSession: IFocusSession): Promise<IFocusSession>;
  get(id: number): Promise<IFocusSession | null>;
  getFocusSessionsForDuration(from: number, to: number): Promise<Array<FocusSession>>;
  getFocusSessionsPaginated(pageIndex: number, pageSize: number): Promise<Array<FocusSession>>;
}

export class FocusSessionRepository implements IFocusSessionRepository {
  db: sqlite3.Database | null = null;
  getLogger: () => Logger | IConsoleLogger;

  constructor(db: sqlite3.Database, getLogger: () => Logger | IConsoleLogger) {
    this.db = db;
    this.getLogger = getLogger;
  }

  private mapRowToFocusSession(row: any): FocusSession {
    return new FocusSession({
      id: row.id,
      startTime: row.start_time,
      endTime: row.end_time,
      name: row.name,
      sessionDidStart: row.session_did_start,
      recordingProcessCrashedOnStart: row.recording_process_crashed_on_start,
      displayUnits: JSON.parse(row.display_units),
      shouldHaveRecording: row.should_have_recording,
      startTrigger: row.start_trigger,
      endTrigger: row.end_trigger,
      sessionStartMetadata: JSON.parse(row.session_start_metadata),
      storageLocation: row.storage_location,
    });
  }

  async save(focusSession: FocusSession): Promise<IFocusSession> {
    // If focus session is new, insert it
    // If focus session is existing, update it
    if (!this.db) {
      this.getLogger().error('Database not initialized');
      throw new Error('Database not initialized');
    }

    if (focusSession.id && focusSession.id > 0) {
      // Update
      const updateQuery = `UPDATE focus_session SET start_time = ?, end_time = ?, name = ?, session_did_start = ?, recording_process_crashed_on_start = ?,
       display_units = ?, should_have_recording = ?, start_trigger = ?, end_trigger = ?, session_start_metadata = ?, storage_location = ? WHERE id = ? RETURNING *`;
      const params = [
        focusSession.startTime,
        focusSession.endTime,
        focusSession.name,
        focusSession.sessionDidStart,
        focusSession.recordingProcessCrashedOnStart,
        JSON.stringify(focusSession.displayUnits),
        focusSession.shouldHaveRecording,
        focusSession.startTrigger,
        focusSession.endTrigger,
        JSON.stringify(focusSession.sessionStartMetadata),
        focusSession.storageLocation,
        focusSession.id,
      ];
      return new Promise((resolve, reject) => {
        this.db!.get(updateQuery, params, (err, row: any) => {
          if (err) {
            this.getLogger().error('Error updating focus session', err);
            reject(err);
          } else {
            resolve(this.mapRowToFocusSession(row));
          }
        });
      });
    } else {
      // Insert
      const insertQuery = `INSERT INTO focus_session (start_time, end_time, name, session_did_start, recording_process_crashed_on_start, display_units, should_have_recording, start_trigger, end_trigger, session_start_metadata, storage_location) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *`;
      const params = [
        focusSession.startTime,
        focusSession.endTime,
        focusSession.name,
        focusSession.sessionDidStart,
        focusSession.recordingProcessCrashedOnStart,
        JSON.stringify(focusSession.displayUnits),
        focusSession.shouldHaveRecording,
        focusSession.startTrigger,
        focusSession.endTrigger,
        JSON.stringify(focusSession.sessionStartMetadata),
        focusSession.storageLocation,
      ];
      return new Promise((resolve, reject) => {
        this.db!.get(insertQuery, params, (err, row: any) => {
          if (err) {
            this.getLogger().error('Error inserting focus session', err);
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
      this.getLogger().error('Database not initialized');
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      this.db!.get(`SELECT * FROM focus_session WHERE _id = ? `, [id], (err, row) => {
        if (err) {
          this.getLogger().error('Error getting focus session', err);
          reject(err);
        } else {
          if (!row) resolve(null);
          else resolve(this.mapRowToFocusSession(row));
        }
      });
    });
  }

  public async getFocusSessionsForDuration(from: number, to: number): Promise<Array<FocusSession>> {
    if (!this.db) {
      this.getLogger().error('Database not initialized');
      throw new Error('Database not initialized');
    }

    const selectQuery = `SELECT * FROM focus_session WHERE start_time BETWEEN ? AND ?`;
    const params: any[] = [from, to];

    return new Promise((resolve, reject) => {
      this.db!.all(selectQuery, params, (err, rows) => {
        if (err) {
          this.getLogger().error('Error getting focus sessions', err);
          reject(err);
        } else {
          resolve(rows.map(this.mapRowToFocusSession));
        }
      });
    });
  }

  public async getFocusSessionsPaginated(pageIndex: number, pageSize: number): Promise<Array<FocusSession>> {
    if (!this.db) {
      this.getLogger().error('Database not initialized');
      throw new Error('Database not initialized');
    }

    const selectQuery = `SELECT * FROM focus_session where end_time > 0 ORDER BY start_time DESC LIMIT ? OFFSET ?`;
    const params: any[] = [pageSize, pageIndex * pageSize];

    return new Promise((resolve, reject) => {
      this.db!.all(selectQuery, params, (err, rows) => {
        if (err) {
          this.getLogger().error('Error getting focus sessions', err);
          reject(err);
        } else {
          const focusSessions = rows.map(this.mapRowToFocusSession);
          resolve(focusSessions);
        }
      });
    });
  }
}
