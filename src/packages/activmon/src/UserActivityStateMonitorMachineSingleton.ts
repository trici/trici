import { Logger, IConsoleLogger } from '@trici/logger';
import { UserActivityStateMachine } from './UserActivityStateMachine';

export class UserActivityStateMachineSingleton {
  private static instance: UserActivityStateMachine;

  private constructor() {}

  public static getInstance(getLogger: () => Logger | IConsoleLogger): UserActivityStateMachine {
    if (!UserActivityStateMachineSingleton.instance) {
      UserActivityStateMachineSingleton.instance = new UserActivityStateMachine(getLogger);
    }

    return UserActivityStateMachineSingleton.instance;
  }
}
