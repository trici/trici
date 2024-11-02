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
    stateMachine = new UserActivityStateMachine(logger);
  });

  test('should initialize with ACTIVE state', () => {
    expect(stateMachine['currentState']).toBe(UserActivityState.ACTIVE);
    expect(stateMachine.getStateHistory()).toEqual([
      { state: UserActivityState.ACTIVE, timestamp: expect.any(Number) },
    ]);
  });

  test('should transition from ACTIVE to GOING_INACTIVE when user has been idle for more than GOING_INACTIVE_THRESHOLD', () => {
    const context = { idleTime: ActivityTimeBounds.GOING_INACTIVE_THRESHOLD + 1, idleTimeDiff: -2 };
    stateMachine.handleEvent(context);
    expect(stateMachine['currentState']).toBe(UserActivityState.GOING_INACTIVE);
    expect(stateMachine.getStateHistory().length).toBe(2);
    expect(stateMachine.getStateHistory()).toEqual([
      { state: UserActivityState.ACTIVE, timestamp: expect.any(Number) },
      { state: UserActivityState.GOING_INACTIVE, timestamp: expect.any(Number) },
    ]);
    expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('from ACTIVE to GOING_INACTIVE'));
  });

  test('should transition from GOING_INACTIVE to INACTIVE when idleTime exceeds threshold', () => {
    stateMachine['currentState'] = UserActivityState.GOING_INACTIVE; // Set initial state
    const context = { idleTime: ActivityTimeBounds.INACTIVE_ACTIVE_THRESHOLD + 1, idleTimeDiff: -2 };
    stateMachine.handleEvent(context);
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
    stateMachine['currentState'] = UserActivityState.INACTIVE; // Set initial state
    const context = {
      idleTime: ActivityTimeBounds.USER_WENT_AWAY_THRESHOLD + 1,
      idleTimeDiff: -2,
    };
    stateMachine.handleEvent(context);
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
    const context = { idleTime: 0, idleTimeDiff: ActivityTimeBounds.USER_WENT_AWAY_THRESHOLD + 1 };
    stateMachine['currentState'] = UserActivityState.AWAY;
    const currentState = stateMachine.getCurrentState();
    expect(currentState).toBe(UserActivityState.AWAY);
    stateMachine.handleEvent(context);
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

  // test('should transition from ACTIVE to BECOMING_HYPER_ACTIVE when idleTime ', () => {

  // test('should transition from INACTIVE to ACTIVE when idleTimeDiff is within thresholds', () => {
  //   const context = { idleTime: 0, idleTimeDiff: ActivityTimeBounds.INACTIVE_ACTIVE_THRESHOLD + 1 };
  //   stateMachine.handleEvent(context);
  //   expect(stateMachine['currentState']).toBe(UserActivityState.ACTIVE);
  //   expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Transitioning from INACTIVE to ACTIVE'));
  // });

  test('should not transition if no conditions are met', () => {
    const initialState = stateMachine['currentState'];
    const context = { idleTime: 0, idleTimeDiff: 0 }; // No transition conditions met
    stateMachine.handleEvent(context);
    expect(stateMachine['currentState']).toBe(initialState); // State should remain unchanged
  });
});
