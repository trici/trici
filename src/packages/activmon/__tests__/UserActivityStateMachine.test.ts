import { UserActivityStateMachine } from '../src/UserActivityStateMachine';
import { UserActivityState, ActivityTimeBounds } from '@trici/models';
import { IConsoleLogger } from '@trici/logger';

describe('UserActivityStateMachine', () => {
  let logger: jest.Mocked<IConsoleLogger>;
  let stateMachine: UserActivityStateMachine;

  beforeAll(() => {
    logger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      log: jest.fn(),
      verbose: jest.fn(),
      debug: jest.fn(),
    };
    jest.useFakeTimers();
    stateMachine = new UserActivityStateMachine(logger);
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  test('should initialize with IDLE state', () => {
    expect(stateMachine['currentState']).toBe(UserActivityState.IDLE);
    expect(stateMachine.getStateHistory()).toEqual([
      { state: UserActivityState.IDLE, timestamp: expect.any(Number) },
    ]);
  });

  test('should transition from IDLE to GOING_INACTIVE when user has been idle for more than GOING_INACTIVE_THRESHOLD', () => {
    const triciPingEventData = { idleTime: ActivityTimeBounds.GOING_INACTIVE_THRESHOLD + 1, idleTimeDiff: -2 };
    stateMachine.handleEvent(triciPingEventData);
    expect(stateMachine['currentState']).toBe(UserActivityState.GOING_INACTIVE);
    expect(stateMachine.getStateHistory().length).toBe(2);
    expect(stateMachine.getStateHistory()).toEqual([
      { state: UserActivityState.IDLE, timestamp: expect.any(Number) },
      { state: UserActivityState.GOING_INACTIVE, timestamp: expect.any(Number) },
    ]);
    expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('from IDLE to GOING_INACTIVE'));
  });

  test('should transition from GOING_INACTIVE to INACTIVE when idleTime exceeds threshold', () => {
    expect(stateMachine.getCurrentState()).toBe(UserActivityState.GOING_INACTIVE);
    const triciPingEventData = { idleTime: ActivityTimeBounds.INACTIVE_THRESHOLD + 1, idleTimeDiff: -2 };
    stateMachine.handleEvent(triciPingEventData);
    expect(stateMachine['currentState']).toBe(UserActivityState.INACTIVE);
    expect(stateMachine.getStateHistory().length).toBe(3);
    expect(stateMachine.getStateHistory()).toEqual([
      { state: UserActivityState.IDLE, timestamp: expect.any(Number) },
      { state: UserActivityState.GOING_INACTIVE, timestamp: expect.any(Number) },
      { state: UserActivityState.INACTIVE, timestamp: expect.any(Number) },
    ]);
    expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('from GOING_INACTIVE to INACTIVE'));
  });

  test('should transition from INACTIVE to AWAY when idleTime exceeds threshold', () => {
    expect(stateMachine.getCurrentState()).toBe(UserActivityState.INACTIVE);
    const triciPingEventData = {
      idleTime: ActivityTimeBounds.USER_WENT_AWAY_THRESHOLD + 1,
      idleTimeDiff: -2,
    };
    stateMachine.handleEvent(triciPingEventData);
    expect(stateMachine['currentState']).toBe(UserActivityState.AWAY);
    expect(stateMachine.getStateHistory()).toEqual([
      { state: UserActivityState.IDLE, timestamp: expect.any(Number) },
      { state: UserActivityState.GOING_INACTIVE, timestamp: expect.any(Number) },
      { state: UserActivityState.INACTIVE, timestamp: expect.any(Number) },
      { state: UserActivityState.AWAY, timestamp: expect.any(Number) },
    ]);
    expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('from INACTIVE to AWAY'));
  });

  test('should transition from AWAY to IDLE when idleTimeDiff exceeds threshold', () => {
    expect(stateMachine.getCurrentState()).toBe(UserActivityState.AWAY);
    const triciPingEventData = { idleTime: 0, idleTimeDiff: ActivityTimeBounds.USER_WENT_AWAY_THRESHOLD + 1 };
    stateMachine.handleEvent(triciPingEventData);
    expect(stateMachine['currentState']).toBe(UserActivityState.IDLE);
    expect(stateMachine.getStateHistory()).toEqual([
      { state: UserActivityState.IDLE, timestamp: expect.any(Number) },
      { state: UserActivityState.GOING_INACTIVE, timestamp: expect.any(Number) },
      { state: UserActivityState.INACTIVE, timestamp: expect.any(Number) },
      { state: UserActivityState.AWAY, timestamp: expect.any(Number) },
      // moving from away to idle
      { state: UserActivityState.IDLE, timestamp: expect.any(Number) },
    ]);
    expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('from AWAY to IDLE'));
  });

  test('should transition from IDLE to ACTIVE based on immediate history average', () => {
    expect(stateMachine.getCurrentState()).toBe(UserActivityState.IDLE);

    // Simulate a series of low idle times to build up immediate history
    for (let i = 0; i < 20; i++) {
      const eventData = { idleTime: ActivityTimeBounds.HISTORY_ACTIVE_THRESHOLD - 1, idleTimeDiff: -2 };
      stateMachine.handleEvent(eventData);
    }

    expect(stateMachine.getCurrentState()).toBe(UserActivityState.ACTIVE);
    expect(stateMachine.getStateHistory()).toContainEqual({
      state: UserActivityState.ACTIVE,
      timestamp: expect.any(Number)
    });
    expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('from IDLE to ACTIVE'));
  });

  test('should transition from ACTIVE to BECOMING_HYPER_ACTIVE based on immediate history average', () => {
    expect(stateMachine.getCurrentState()).toBe(UserActivityState.ACTIVE);

    // Simulate a series of low idle times to build up immediate history
    for (let i = 0; i < 20; i++) {
      const eventData = {
        idleTime: ActivityTimeBounds.HISTORY_BECOMING_HYPER_ACTIVE_THRESHOLD - 1,
        idleTimeDiff: -2
      };
      stateMachine.handleEvent(eventData);
    }

    expect(stateMachine.getCurrentState()).toBe(UserActivityState.BECOMING_HYPER_ACTIVE);
    expect(stateMachine.getStateHistory()).toContainEqual({
      state: UserActivityState.BECOMING_HYPER_ACTIVE,
      timestamp: expect.any(Number)
    });
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining('from ACTIVE to BECOMING_HYPER_ACTIVE')
    );
  });

  test('should transition from BECOMING_HYPER_ACTIVE to HYPER_ACTIVE based on immediate history average', () => {
    expect(stateMachine.getCurrentState()).toBe(UserActivityState.BECOMING_HYPER_ACTIVE);

    // Simulate even lower idle times to trigger HYPER_ACTIVE
    for (let i = 0; i < 20; i++) {
      const eventData = {
        idleTime: ActivityTimeBounds.HISTORY_HYPER_ACTIVE_THRESHOLD - 1,
        idleTimeDiff: -2
      };
      stateMachine.handleEvent(eventData);
    }

    expect(stateMachine.getCurrentState()).toBe(UserActivityState.HYPER_ACTIVE);
    expect(stateMachine.getStateHistory()).toContainEqual({
      state: UserActivityState.HYPER_ACTIVE,
      timestamp: expect.any(Number)
    });
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining('from BECOMING_HYPER_ACTIVE to HYPER_ACTIVE')
    );
  });

  test('should transition from HYPER_ACTIVE back to BECOMING_HYPER_ACTIVE when activity slightly decreases', () => {
    expect(stateMachine.getCurrentState()).toBe(UserActivityState.HYPER_ACTIVE);

    // Simulate slightly higher idle times
    for (let i = 0; i < 20; i++) {
      const eventData = {
        idleTime: (ActivityTimeBounds.HISTORY_HYPER_ACTIVE_THRESHOLD +
                  ActivityTimeBounds.HISTORY_BECOMING_HYPER_ACTIVE_THRESHOLD) / 2,
        idleTimeDiff: -1
      };
      stateMachine.handleEvent(eventData);
    }

    expect(stateMachine.getCurrentState()).toBe(UserActivityState.BECOMING_HYPER_ACTIVE);
    expect(stateMachine.getStateHistory()).toContainEqual({
      state: UserActivityState.BECOMING_HYPER_ACTIVE,
      timestamp: expect.any(Number)
    });
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining('from HYPER_ACTIVE to BECOMING_HYPER_ACTIVE')
    );
  });

  test('should transition from BECOMING_HYPER_ACTIVE to ACTIVE when activity significantly decreases', () => {
    expect(stateMachine.getCurrentState()).toBe(UserActivityState.BECOMING_HYPER_ACTIVE);

    // Simulate higher idle times that indicate normal activity
    for (let i = 0; i < 20; i++) {
      const eventData = {
        idleTime: (ActivityTimeBounds.HISTORY_BECOMING_HYPER_ACTIVE_THRESHOLD +
                  ActivityTimeBounds.HISTORY_ACTIVE_THRESHOLD) / 2,
        idleTimeDiff: -1
      };
      stateMachine.handleEvent(eventData);
    }

    expect(stateMachine.getCurrentState()).toBe(UserActivityState.ACTIVE);
    expect(stateMachine.getStateHistory()).toContainEqual({
      state: UserActivityState.ACTIVE,
      timestamp: expect.any(Number)
    });
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining('from BECOMING_HYPER_ACTIVE to ACTIVE')
    );
  });

  test('should not transition if no conditions are met', () => {
    const initialState = stateMachine['currentState'];
    const triciPingEventData = { idleTime: 0, idleTimeDiff: 0 }; // No transition conditions met
    stateMachine.handleEvent(triciPingEventData);
    expect(stateMachine['currentState']).toBe(initialState); // State should remain unchanged
  });
});
