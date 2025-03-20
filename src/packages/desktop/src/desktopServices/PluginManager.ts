import { AppEventEmitter } from './AppEventEmitter';
import { TriciAppEvent } from '@trici/models';
import { ITriciPlugin } from '../typedefs/ITriciPlugin';
import { IPluginManager } from '../typedefs/IPluginManager';
import type { Logger } from '@trici/logger';
import { IConsoleLogger } from '@trici/logger';

interface PluginWithPriority {
  plugin: ITriciPlugin;
  priority: number;
}

export class PluginManager implements IPluginManager {
  private plugins: PluginWithPriority[];
  private eventBus: AppEventEmitter;
  private getLogger: () => Logger | IConsoleLogger;
  private static instance: PluginManager;
  private initialized: boolean = false;

  private constructor(getLogger: () => Logger | IConsoleLogger, appEventEmitter: AppEventEmitter) {
    this.plugins = [];
    this.eventBus = appEventEmitter;
    this.getLogger = getLogger;
    this.initialized = false;
  }

  public static getInstance(getLogger: () => Logger | IConsoleLogger, appEventEmitter: AppEventEmitter): PluginManager {
    if (!PluginManager.instance) {
      PluginManager.instance = new PluginManager(getLogger, appEventEmitter);
    }
    return PluginManager.instance;
  }

  public initialize(): void {
    Object.values(TriciAppEvent).forEach(event => {
      console.log('PluginManager.initialize', event);
      const self = this;
      this.eventBus.on(event, (...args: any[]) => {
        self.emit(event, ...args);
      });
    });
    this.initialized = true;
  }

  public register(plugin: ITriciPlugin, priority: number = 5000): void {
    if (!this.initialized) {
      throw new Error('PluginManager not initialized');
    }

    if (priority < 1 || priority > 10000) {
      throw new Error('Priority must be between 1 and 10000');
    }

    this.plugins.push({ plugin, priority });
    this.plugins.sort((a, b) => a.priority - b.priority);
  }

  public emit<E extends TriciAppEvent>(event: E, ...args: any[]): void {
    console.log('PluginManager.emit', event, args);
    this.plugins.forEach(({ plugin }) => {
      plugin.handleEvent(event, ...args);
    });
  }
}
