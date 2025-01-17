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

  describe('getFocusSessions', () => {
    it('should get focus sessions from the database', async () => {
      const focusSessions = await repository.getFocusSessions(Date.now() - 1000, Date.now());
      expect(focusSessions.length).toBeGreaterThan(0);
    });
  });

  afterAll(async () => {
    await afterAllInitCommon();
  });
});
