import { UserActivityState, ActivityTimeBounds } from '@trici/models';
import { Logger, IConsoleLogger } from '@trici/logger';
import EventEmitter from 'events';
import { IdleTimeHistory } from './IdleTimeHistory';

export type UserActivityStateHistoryRecord = {
  state: UserActivityState;
  timestamp: number;
};

export type UserActivityStateHistory = UserActivityStateHistoryRecord[];

export type TriciPingEventData = {
  idleTime: number;
  idleTimeDiff: number;
};

export interface IUserActivityStateMachine {
  getCurrentState(): UserActivityState;
  getStateHistory(): UserActivityStateHistory;
  handleEvent(data: TriciPingEventData): void;
}

interface StateTransition {
  from: UserActivityState;
  to: UserActivityState;
  condition: (context: TriciPingEventData, idleTimeImmediateHistoryAverage: number) => boolean;
}

export class UserActivityStateMachine extends EventEmitter implements IUserActivityStateMachine {
  private currentState: UserActivityState;
  private stateHistory: UserActivityStateHistory;
  private idleTimeHistory: IdleTimeHistory;
  private logger: Logger | IConsoleLogger;
  private transitions: StateTransition[];
  // private startedBecomingHyperActiveAt: number;

  // idleTimeDiff is considered for state transitions
  // when the user has been idle for a certain amount of time
  // and then becomes active. Otherwise the idleTime is considered.
  private defineTransitions(): StateTransition[] {
    return [
      {
        from: UserActivityState.AWAY,
        to: UserActivityState.IDLE,
        condition: (context: TriciPingEventData, idleTimeImmediateHistoryAverage: number) =>
          context.idleTimeDiff > ActivityTimeBounds.USER_WENT_AWAY_THRESHOLD
      },
      {
        from: UserActivityState.INACTIVE,
        to: UserActivityState.IDLE,
        condition: (context: TriciPingEventData, idleTimeImmediateHistoryAverage: number) =>
          context.idleTimeDiff > ActivityTimeBounds.INACTIVE_THRESHOLD &&
          context.idleTimeDiff < ActivityTimeBounds.USER_WENT_AWAY_THRESHOLD,
      },
      {
        from: UserActivityState.IDLE,
        to: UserActivityState.GOING_INACTIVE,
        condition: (context: TriciPingEventData, idleTimeImmediateHistoryAverage: number) =>
          context.idleTime > ActivityTimeBounds.GOING_INACTIVE_THRESHOLD &&
          context.idleTime <= ActivityTimeBounds.GOING_INACTIVE_THRESHOLD + 2,
      },
      {
        from: UserActivityState.GOING_INACTIVE,
        to: UserActivityState.IDLE,
        condition: (context: TriciPingEventData, idleTimeImmediateHistoryAverage: number) =>
          context.idleTimeDiff > ActivityTimeBounds.GOING_INACTIVE_THRESHOLD &&
          context.idleTimeDiff < ActivityTimeBounds.INACTIVE_THRESHOLD,
      },
      {
        from: UserActivityState.GOING_INACTIVE,
        to: UserActivityState.INACTIVE,
        condition: (context: TriciPingEventData, idleTimeImmediateHistoryAverage: number) => context.idleTime > ActivityTimeBounds.INACTIVE_THRESHOLD,
      },
      {
        from: UserActivityState.INACTIVE,
        to: UserActivityState.AWAY,
        condition: (context: TriciPingEventData, idleTimeImmediateHistoryAverage: number) => context.idleTime > ActivityTimeBounds.USER_WENT_AWAY_THRESHOLD,
      },
      {
        from: UserActivityState.IDLE,
        to: UserActivityState.ACTIVE,
        condition: (context: TriciPingEventData, idleTimeImmediateHistoryAverage: number) =>
          idleTimeImmediateHistoryAverage < ActivityTimeBounds.HISTORY_ACTIVE_THRESHOLD,
      },
      {
        from: UserActivityState.ACTIVE,
        to: UserActivityState.BECOMING_HYPER_ACTIVE,
        condition: (context: TriciPingEventData, idleTimeImmediateHistoryAverage: number) =>
          idleTimeImmediateHistoryAverage < ActivityTimeBounds.HISTORY_BECOMING_HYPER_ACTIVE_THRESHOLD &&
          idleTimeImmediateHistoryAverage > ActivityTimeBounds.HISTORY_HYPER_ACTIVE_THRESHOLD,
      },
      {
        from: UserActivityState.BECOMING_HYPER_ACTIVE,
        to: UserActivityState.HYPER_ACTIVE,
        condition: (context: TriciPingEventData, idleTimeImmediateHistoryAverage: number) =>
          idleTimeImmediateHistoryAverage < ActivityTimeBounds.HISTORY_HYPER_ACTIVE_THRESHOLD,
      },
      {
        from: UserActivityState.HYPER_ACTIVE,
        to: UserActivityState.BECOMING_HYPER_ACTIVE,
        condition: (context: TriciPingEventData, idleTimeImmediateHistoryAverage: number) =>
          idleTimeImmediateHistoryAverage > ActivityTimeBounds.HISTORY_HYPER_ACTIVE_THRESHOLD &&
          idleTimeImmediateHistoryAverage < ActivityTimeBounds.HISTORY_BECOMING_HYPER_ACTIVE_THRESHOLD,
      },
      {
        from: UserActivityState.BECOMING_HYPER_ACTIVE,
        to: UserActivityState.ACTIVE,
        condition: (context: TriciPingEventData, idleTimeImmediateHistoryAverage: number) =>
          idleTimeImmediateHistoryAverage > ActivityTimeBounds.HISTORY_BECOMING_HYPER_ACTIVE_THRESHOLD &&
          idleTimeImmediateHistoryAverage < ActivityTimeBounds.HISTORY_ACTIVE_THRESHOLD,
      },
      {
        from: UserActivityState.ACTIVE,
        to: UserActivityState.IDLE,
        condition: (context: TriciPingEventData, idleTimeImmediateHistoryAverage: number) => context.idleTime > ActivityTimeBounds.IDLE_THRESHOLD,
      },
    ];
  }

  constructor(logger: Logger | IConsoleLogger) {
    super();
    this.currentState = UserActivityState.IDLE;
    this.stateHistory = [{ state: this.currentState, timestamp: Date.now() }];
    this.idleTimeHistory = new IdleTimeHistory();
    this.logger = logger;
    this.transitions = this.defineTransitions();
    // this.startedBecomingHyperActiveAt = 0;
  }

  public getCurrentState(): UserActivityState {
    return this.currentState;
  }

  public getStateHistory(): UserActivityStateHistory {
    return this.stateHistory;
  }

  private transitionTo(newState: UserActivityState): void {
    if (this.currentState !== newState) {
      // If required, can add stateExitActions
      // this.handleStateExitActions(prevState)
      this.logger.info(`UserActivityStateMachine transitioning from ${this.currentState} to ${newState}`);
      this.currentState = newState;
      this.stateHistory.push({ state: this.currentState, timestamp: Date.now() });

      this.emit('stateChanged', newState);
    }
  }

  // Right now, this is just used for handling triciping events. In the future,
  // we could add other events that trigger state transitions.
  public handleEvent(data: TriciPingEventData): void {
    this.idleTimeHistory.add(data.idleTime);
    // should
    // this.setIfUserIsStartingToBecomeHyperActive(data);
    const idleTimeImmediateHistory = this.idleTimeHistory.getImmediateHistory();
    const immediateHistoryAverage =  idleTimeImmediateHistory.length < 20 ? 10 : idleTimeImmediateHistory.reduce((acc, idleTime) => acc + idleTime, 0) / idleTimeImmediateHistory.length;
    console.log('immediateHistoryAverage', immediateHistoryAverage);

    for (const transition of this.transitions) {
      if (this.currentState === transition.from && transition.condition(data, immediateHistoryAverage)) {
        this.transitionTo(transition.to);
        break;
      }
    }
  }

  // setIfUserIsStartingToBecomeHyperActive(data: TriciPingEventData) {
  //   if (data.idleTime < ActivityTimeBounds.ACTIVE_HYPER_ACTIVE_THRESHOLD) {
  //     if (this.startedBecomingHyperActiveAt === 0) {
  //       this.startedBecomingHyperActiveAt = Date.now();
  //     }
  //   } else if (data.idleTime > ActivityTimeBounds.ACTIVE_HYPER_ACTIVE_THRESHOLD && this.currentState === UserActivityState.ACTIVE) {
  //     this.startedBecomingHyperActiveAt = 0;
  //   }
  // }
}
