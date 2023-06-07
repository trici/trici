import { AppEventEmitter } from "./AppEventEmitter";
import { TRICI_APP_EVENT } from "@trici/models";
import { ITriciPlugin } from "../typedefs/ITriciPlugin";
import { IPluginManager } from "../typedefs/IPluginManager";
import type { Logger } from "@trici/logger";
import { IConsoleLogger } from "@trici/logger";


export class PluginManager implements IPluginManager {
  private plugins: ITriciPlugin[];
  private eventBus: AppEventEmitter;
  private logger: Logger | IConsoleLogger;
  private static instance: PluginManager;
  private initialized: boolean = false;

  private constructor(logger: Logger | IConsoleLogger, appEventEmitter: AppEventEmitter) {
    this.plugins = [];
    this.eventBus = appEventEmitter;
    this.logger = logger;
    this.initialized = false;
  }

  public static getInstance(logger: Logger | IConsoleLogger , appEventEmitter: AppEventEmitter): PluginManager {
    if (!PluginManager.instance) {
      PluginManager.instance = new PluginManager(logger, appEventEmitter);
    }
    return PluginManager.instance;
  }

  public initialize(): void {
    Object.values(TRICI_APP_EVENT).forEach((event) => {
      console.log("PluginManager.initialize", event);
      const self = this;
      this.eventBus.on(event, (...args: any[]) => {
        self.emit(event, ...args);
      });
    });
    this.initialized = true;
  }

  public register(plugin: ITriciPlugin): void {
    if (!this.initialized) {
      throw new Error("PluginManager not initialized");
    }
    this.plugins.push(plugin);
    // plugin.initialize(this);
  }

  public emit<E extends TRICI_APP_EVENT>(event: E, ...args: any[]): void {
    console.log("PluginManager.emit", event, args);
    this.plugins.forEach(plugin => {
      plugin.handleEvent(event, ...args);
    });
  }
}

