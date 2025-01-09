import { AppEventRepository } from '../src/AppEventRepository';
import sqlite3 from 'sqlite3';
import type { Logger } from '@trici/logger';
import { IAppEvent, TriciAppEvent } from '@trici/models';
import { v4 as uuidv4 } from 'uuid';
import { beforeAllInitCommon, afterAllInitCommon } from './TestHelpers';

describe('AppEventRepository', () => {
  let repository: AppEventRepository;
  let db: sqlite3.Database;
  let logger: Logger;

  beforeAll(async () => {
    const { db, logger } = await beforeAllInitCommon();
    repository = new AppEventRepository(db, logger);
  });

  afterAll(async () => {
    await afterAllInitCommon();
  });

  describe('save and getAppEvents', () => {
    it('should save a tap event to the database', async () => {
      const tapEvent: IAppEvent = {
        id: uuidv4(),
        type: TriciAppEvent.FRONTMOST_APP_CHANGED,
        timestamp: Date.now(),
        data: [
          {
            frontmostApp: 'Code',
            previousFrontmostApp: 'Terminal',
            previousAppActiveTime: 210,
          },
        ],
      };

      expect(async () => await repository.save(tapEvent)).not.toThrow();
    });

    it('should retrieve tap events from the database', async () => {
      const from = Date.now() - 10000; // 10 seconds ago
      const to = Date.now();
      const type = TriciAppEvent.FRONTMOST_APP_CHANGED; // Assuming an event type

      const events = await repository.getAppEvents(from, to, type);

      console.log('retrieved events', events);
      expect(events).toHaveLength(1);
      const retrievedEvent = events[0];
      expect(retrievedEvent.type).toEqual(TriciAppEvent.FRONTMOST_APP_CHANGED);

      // Verify the events are retrieved correctly
      // This could include checking the length of the events array and properties of the events
    });
  });
});
