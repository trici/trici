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

  test('should initialize with ACTIVE state', () => {
    expect(stateMachine['currentState']).toBe(UserActivityState.ACTIVE);
    expect(stateMachine.getStateHistory()).toEqual([
      { state: UserActivityState.ACTIVE, timestamp: expect.any(Number) },
    ]);
  });

  test('should transition from ACTIVE to GOING_INACTIVE when user has been idle for more than GOING_INACTIVE_THRESHOLD', () => {
    const triciPingEventData = { idleTime: ActivityTimeBounds.GOING_INACTIVE_THRESHOLD + 1, idleTimeDiff: -2 };
    stateMachine.handleEvent(triciPingEventData);
    expect(stateMachine['currentState']).toBe(UserActivityState.GOING_INACTIVE);
    expect(stateMachine.getStateHistory().length).toBe(2);
    expect(stateMachine.getStateHistory()).toEqual([
      { state: UserActivityState.ACTIVE, timestamp: expect.any(Number) },
      { state: UserActivityState.GOING_INACTIVE, timestamp: expect.any(Number) },
    ]);
    expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('from ACTIVE to GOING_INACTIVE'));
  });

  test('should transition from GOING_INACTIVE to INACTIVE when idleTime exceeds threshold', () => {
    expect(stateMachine.getCurrentState()).toBe(UserActivityState.GOING_INACTIVE);
    const triciPingEventData = { idleTime: ActivityTimeBounds.INACTIVE_ACTIVE_THRESHOLD + 1, idleTimeDiff: -2 };
    stateMachine.handleEvent(triciPingEventData);
    expect(stateMachine['currentState']).toBe(UserActivityState.INACTIVE);
    expect(stateMachine.getStateHistory().length).toBe(3);
    expect(stateMachine.getStateHistory()).toEqual([
      { state: UserActivityState.ACTIVE, timestamp: expect.any(Number) },
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
      { state: UserActivityState.ACTIVE, timestamp: expect.any(Number) },
      { state: UserActivityState.GOING_INACTIVE, timestamp: expect.any(Number) },
      { state: UserActivityState.INACTIVE, timestamp: expect.any(Number) },
      { state: UserActivityState.AWAY, timestamp: expect.any(Number) },
    ]);
    expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('from INACTIVE to AWAY'));
  });

  test('should transition from AWAY to ACTIVE when idleTimeDiff exceeds threshold', () => {
    expect(stateMachine.getCurrentState()).toBe(UserActivityState.AWAY);
    const triciPingEventData = { idleTime: 0, idleTimeDiff: ActivityTimeBounds.USER_WENT_AWAY_THRESHOLD + 1 };
    stateMachine.handleEvent(triciPingEventData);
    expect(stateMachine['currentState']).toBe(UserActivityState.ACTIVE);
    expect(stateMachine.getStateHistory()).toEqual([
      { state: UserActivityState.ACTIVE, timestamp: expect.any(Number) },
      { state: UserActivityState.GOING_INACTIVE, timestamp: expect.any(Number) },
      { state: UserActivityState.INACTIVE, timestamp: expect.any(Number) },
      { state: UserActivityState.AWAY, timestamp: expect.any(Number) },
      // moving from away to active
      { state: UserActivityState.ACTIVE, timestamp: expect.any(Number) },
    ]);
    expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('from AWAY to ACTIVE'));
  });

  test('should transition from ACTIVE to BECOMING_HYPER_ACTIVE when user has been hyper active for more than ACTIVE_HYPER_ACTIVE_THRESHOLD', () => {
    expect(stateMachine.getCurrentState()).toBe(UserActivityState.ACTIVE);
    // First, simulate the user starting to become hyper-active
    const initialEventData = { idleTime: 0, idleTimeDiff: -2 };
    stateMachine.handleEvent(initialEventData);

    // Advance time to just before the threshold
    jest.advanceTimersByTime((ActivityTimeBounds.BECOMING_HYPER_ACTIVE_THRESHOLD - 1) * 1000);

    // User is still active; no state change should occur
    stateMachine.handleEvent(initialEventData);
    expect(stateMachine.getCurrentState()).toBe(UserActivityState.ACTIVE);

    // Advance time to exceed the threshold
    jest.advanceTimersByTime(2000); // Advance by an additional 2 seconds

    // Now, the condition for becoming hyper-active should be met
    stateMachine.handleEvent(initialEventData);

    expect(stateMachine.getCurrentState()).toBe(UserActivityState.BECOMING_HYPER_ACTIVE);
    expect(stateMachine.getStateHistory()).toEqual([
      { state: UserActivityState.ACTIVE, timestamp: expect.any(Number) },
      { state: UserActivityState.GOING_INACTIVE, timestamp: expect.any(Number) },
      { state: UserActivityState.INACTIVE, timestamp: expect.any(Number) },
      { state: UserActivityState.AWAY, timestamp: expect.any(Number) },
      { state: UserActivityState.ACTIVE, timestamp: expect.any(Number) },
      { state: UserActivityState.BECOMING_HYPER_ACTIVE, timestamp: expect.any(Number) },
    ]);
    expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('from ACTIVE to BECOMING_HYPER_ACTIVE'));
  });

  test('should transition from BECOMING_HYPER_ACTIVE to HYPER_ACTIVE when user has been hyper active for more than HYPER_ACTIVE_THRESHOLD', () => {
    expect(stateMachine.getCurrentState()).toBe(UserActivityState.BECOMING_HYPER_ACTIVE);
    const initialEventData = { idleTime: 0, idleTimeDiff: -2 };
    stateMachine.handleEvent(initialEventData);

    // Advance time to just before the threshold
    jest.advanceTimersByTime(
      (ActivityTimeBounds.HYPER_ACTIVE_THRESHOLD - ActivityTimeBounds.BECOMING_HYPER_ACTIVE_THRESHOLD - 1) * 1000,
    );

    // User is still active; no state change should occur
    stateMachine.handleEvent(initialEventData);
    expect(stateMachine.getCurrentState()).toBe(UserActivityState.BECOMING_HYPER_ACTIVE);

    // Advance time to exceed the threshold
    jest.advanceTimersByTime(2000); // Advance by an additional 2 seconds

    // Now, the condition for becoming hyper-active should be met
    stateMachine.handleEvent(initialEventData);

    expect(stateMachine.getCurrentState()).toBe(UserActivityState.HYPER_ACTIVE);
    expect(stateMachine.getStateHistory()).toEqual([
      { state: UserActivityState.ACTIVE, timestamp: expect.any(Number) },
      { state: UserActivityState.GOING_INACTIVE, timestamp: expect.any(Number) },
      { state: UserActivityState.INACTIVE, timestamp: expect.any(Number) },
      { state: UserActivityState.AWAY, timestamp: expect.any(Number) },
      { state: UserActivityState.ACTIVE, timestamp: expect.any(Number) },
      { state: UserActivityState.BECOMING_HYPER_ACTIVE, timestamp: expect.any(Number) },
      { state: UserActivityState.HYPER_ACTIVE, timestamp: expect.any(Number) },
    ]); // The state history should include the hyper-active state
    expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('from BECOMING_HYPER_ACTIVE to HYPER_ACTIVE'));
  });

  test('should transition from HYPER_ACTIVE to ACTIVE when user has been idle for more than HYPER_ACTIVE_THRESHOLD', () => {
    expect(stateMachine.getCurrentState()).toBe(UserActivityState.HYPER_ACTIVE);
    const initialEventData = { idleTime: ActivityTimeBounds.ACTIVE_HYPER_ACTIVE_THRESHOLD + 1, idleTimeDiff: -2 };
    stateMachine.handleEvent(initialEventData);
    expect(stateMachine.getCurrentState()).toBe(UserActivityState.ACTIVE);
    console.log('stateHistory:', stateMachine.getStateHistory());
    expect(stateMachine.getStateHistory()).toEqual([
      { state: UserActivityState.ACTIVE, timestamp: expect.any(Number) },
      { state: UserActivityState.GOING_INACTIVE, timestamp: expect.any(Number) },
      { state: UserActivityState.INACTIVE, timestamp: expect.any(Number) },
      { state: UserActivityState.AWAY, timestamp: expect.any(Number) },
      { state: UserActivityState.ACTIVE, timestamp: expect.any(Number) },
      { state: UserActivityState.BECOMING_HYPER_ACTIVE, timestamp: expect.any(Number) },
      { state: UserActivityState.HYPER_ACTIVE, timestamp: expect.any(Number) },
      { state: UserActivityState.ACTIVE, timestamp: expect.any(Number) },
    ]);
    expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('from HYPER_ACTIVE to ACTIVE'));
  });

  test('should not transition if no conditions are met', () => {
    const initialState = stateMachine['currentState'];
    const triciPingEventData = { idleTime: 0, idleTimeDiff: 0 }; // No transition conditions met
    stateMachine.handleEvent(triciPingEventData);
    expect(stateMachine['currentState']).toBe(initialState); // State should remain unchanged
  });
});
