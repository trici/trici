import { Logger } from '@trici/logger';
import { beforeAllInitCommon, afterAllInitCommon } from './TestHelpers';
import { FocusSessionRepository } from '../src/FocusSessionRepository';
import sqlite3 from 'sqlite3';
import { FocusSession, SessionStartedBy, SessionStartedFrom } from '@trici/models';

describe('FocusSessionRepository', () => {
  let repository: FocusSessionRepository;
  let db: sqlite3.Database;
  let logger: Logger;

  beforeAll(async () => {
    const { db, logger } = await beforeAllInitCommon();
    repository = new FocusSessionRepository(db, logger);
  });

  describe('create and save a new FocusSession', () => {
    it('should save a new FocusSession to the database', async () => {
      const newFocusSession: FocusSession = new FocusSession({
        id: -1,
        startTime: Date.now(),
        endTime: 0,
        name: '',
        sessionDidStart: true,
        recordingProcessCrashedOnStart: false,
        displayUnits: [],
        shouldHaveRecording: true,
        startedBy: SessionStartedBy.TRICI_ACTIVITY,
        startedFrom: SessionStartedFrom.APP_EVENT,
        sessionStartMetadata: {
          appName: 'Code',
          durationOfCurrentApp: 210,
          idleTimeNearHistoryAverage: 100,
          idleTimeImmediateHistoryAverage: 50,
        },
      });
      const savedFocusSession = await repository.save(newFocusSession);
      expect(savedFocusSession.id).not.toBe(-1);
      expect(savedFocusSession.startTime).toBe(newFocusSession.startTime);

      const sessionToModify = new FocusSession(savedFocusSession);
      const modifiedFocusSession = sessionToModify.withMutations(obj => {
        obj.set('endTime', Date.now()).set('name', 'Test Focus Session');
      });
      const savedModifiedFocusSession = await repository.save(modifiedFocusSession);
      expect(savedModifiedFocusSession.id).toBe(savedFocusSession.id);
      expect(savedModifiedFocusSession.endTime).toBe(modifiedFocusSession.endTime);
      expect(savedModifiedFocusSession.name).toBe(modifiedFocusSession.name);
    });
  });

  describe('getFocusSessionsForDuration', () => {
    it('should get focus sessions for a given time range', async () => {
      const now = Date.now();
      const from = now - 1000;
      const to = now;

      const focusSessions = await repository.getFocusSessionsForDuration(from, to);
      expect(Array.isArray(focusSessions)).toBe(true);
      focusSessions.forEach(session => {
        expect(session.startTime).toBeGreaterThanOrEqual(from);
        expect(session.startTime).toBeLessThanOrEqual(to);
      });
    });
  });

  describe('getFocusSessionsPaginated', () => {
    it('should get paginated focus sessions', async () => {
      const pageSize = 10;
      const pageIndex = 0;

      const focusSessions = await repository.getFocusSessionsPaginated(pageIndex, pageSize);
      expect(Array.isArray(focusSessions)).toBe(true);
      expect(focusSessions.length).toBeLessThanOrEqual(pageSize);

      // Verify sessions are ordered by start_time DESC
      for (let i = 1; i < focusSessions.length; i++) {
        expect(focusSessions[i - 1].startTime).toBeGreaterThanOrEqual(focusSessions[i].startTime);
      }
    });

    it('should return empty array for page beyond available data', async () => {
      const pageSize = 10;
      const pageIndex = 9999; // Very high page number

      const focusSessions = await repository.getFocusSessionsPaginated(pageIndex, pageSize);
      expect(Array.isArray(focusSessions)).toBe(true);
      expect(focusSessions.length).toBe(0);
    });
  });

  afterAll(async () => {
    await afterAllInitCommon();
  });
});
