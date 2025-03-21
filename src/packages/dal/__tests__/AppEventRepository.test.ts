import { AppEventRepository } from '../src/AppEventRepository';
import sqlite3 from 'sqlite3';
import { getConsoleLogger } from '@trici/logger';
import { IAppEvent, TriciAppEvent } from '@trici/models';
import { v4 as uuidv4 } from 'uuid';
import { beforeAllInitCommon, afterAllInitCommon } from './TestHelpers';

describe('AppEventRepository', () => {
  let repository: AppEventRepository;
  let db: sqlite3.Database;

  beforeAll(async () => {
    const { db } = await beforeAllInitCommon();
    repository = new AppEventRepository(db, getConsoleLogger);
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

    it('should retrieve all app events within a time range', async () => {
      // Create multiple events with different types
      const events: IAppEvent[] = [
        {
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
        },
        {
          id: uuidv4(),
          type: TriciAppEvent.USER_ACTIVE,
          timestamp: Date.now() + 1000, // 1 second later
          data: [{ status: 'started' }],
        },
      ];

      // Save both events
      await Promise.all(events.map(event => repository.save(event)));

      // Retrieve all events from the last minute
      const from = Date.now() - 60000; // 1 minute ago
      const to = Date.now() + 60000; // 1 minute in the future
      const allEvents = await repository.getAllAppEvents(from, to);

      // We expect at least the 2 events we just created plus the one from the previous test
      expect(allEvents.length).toBeGreaterThanOrEqual(3);

      // Verify that events of different types are present
      expect(allEvents.some(e => e.type === TriciAppEvent.FRONTMOST_APP_CHANGED)).toBeTruthy();
      expect(allEvents.some(e => e.type === TriciAppEvent.USER_ACTIVE)).toBeTruthy();

      // Verify the structure of retrieved events
      allEvents.forEach(event => {
        expect(event).toHaveProperty('id');
        expect(event).toHaveProperty('type');
        expect(event).toHaveProperty('timestamp');
        expect(event).toHaveProperty('data');
        expect(Array.isArray(event.data)).toBeTruthy();
      });
    });
  });
});
