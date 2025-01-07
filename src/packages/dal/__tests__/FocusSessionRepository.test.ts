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
    });
  });

  afterAll(async () => {
    await afterAllInitCommon();
  });
});
