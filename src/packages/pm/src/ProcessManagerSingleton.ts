import { ProcessManager } from './ProcessManager';
import type { Logger } from '@trici/logger';

export interface IProcessManagerSingleton {
  getInstance(logger: Logger): ProcessManager;
}
export class ProcessManagerSingleton {
  private static instance: ProcessManager;

  private constructor() {}

  public static getInstance(logger: Logger): ProcessManager {
    if (!ProcessManagerSingleton.instance) {
      console.log('Starting Process Manager ');
      ProcessManagerSingleton.instance = new ProcessManager(logger);
    }

    return ProcessManagerSingleton.instance;
  }
}
