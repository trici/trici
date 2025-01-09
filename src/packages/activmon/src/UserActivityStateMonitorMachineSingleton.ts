import { Logger } from '@trici/logger';
import { UserActivityStateMachine } from './UserActivityStateMachine';

export class UserActivityStateMachineSingleton {
  private static instance: UserActivityStateMachine;

  private constructor() {}

  public static getInstance(logger: Logger): UserActivityStateMachine {
    if (!UserActivityStateMachineSingleton.instance) {
      UserActivityStateMachineSingleton.instance = new UserActivityStateMachine(logger);
    }

    return UserActivityStateMachineSingleton.instance;
  }
}
