import { ProcessManager } from './ProcessManager';
import type { IConsoleLogger, Logger } from '@trici/logger';

export interface IProcessManagerSingleton {
  getInstance(logger: Logger): ProcessManager;
}
export class ProcessManagerSingleton {
  private static instance: ProcessManager;

  private constructor() {}

  public static getInstance(getLogger: () => Logger | IConsoleLogger): ProcessManager {
    if (!ProcessManagerSingleton.instance) {
      console.log('Starting Process Manager ');
      ProcessManagerSingleton.instance = new ProcessManager(getLogger);
    }

    return ProcessManagerSingleton.instance;
  }
}
