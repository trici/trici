import { IdleTimeServiceInstance } from "./IdleTimeService";
import type { AppObserverServiceInstance } from "@trici/app-observer";
import { ITriciRepository } from "@trici/dal";
import type { Logger } from "@trici/logger";
import  { EventEmitter } from "events";
import { DailyUserActivity } from "@trici/models";

export interface IUserActivityMonitorService {
  start(): void;
  stop(): void;
}

export class UserActivityMonitorService extends EventEmitter implements IUserActivityMonitorService {
  idleTimeServiceInstance: IdleTimeServiceInstance;
  appObserverServiceInstance: AppObserverServiceInstance;
  logger: Logger;
  lastIdleTime: number;
  userWentAwayAt: number;
  userCameBackAt: number;
  userBecameActiveAt: number;
  userBecameSuperActiveAt: number;
  userBecameHyperActiveAt: number;
  userHyperActiveForInSeconds: number;
  userBecameInactiveAt: number;
  repository: ITriciRepository;
  todaysUserActitivity:  DailyUserActivity | null;

  constructor(logger: Logger, idleTimeServiceInstance: IdleTimeServiceInstance, appObserverServiceInstance: AppObserverServiceInstance, repository: ITriciRepository) {
    super();
    this.logger = logger;
    this.idleTimeServiceInstance = idleTimeServiceInstance;
    this.appObserverServiceInstance = appObserverServiceInstance;
    this.lastIdleTime = -1;
    this.userBecameActiveAt = 0;
    this.userBecameSuperActiveAt = 0;
    this.userBecameHyperActiveAt = 0;
    this.userHyperActiveForInSeconds = 0;
    this.userBecameInactiveAt = 0;
    this.userWentAwayAt = 0;
    this.userCameBackAt = 0;
    this.repository = repository;
  }

  start(): void {
    //Register event handlers to handle events from the services.
    this.idleTimeServiceInstance.on('triciping', (idleTime: number) => {
      this.logger.info(`UserActivityMonitorService triciping: ${idleTime}`);
    });

    this.appObserverServiceInstance.on('frontmostAppChanged', (frontmostApp: string ) => {
      console.log('UserActivityMonitorService frontmostAppChanged:', frontmostApp);
      this.logger.info(`UserActivityMonitorService frontmostAppChanged:${frontmostApp}`);
      // Save the data to the db. I am wondering whether there should be a BLL.

    });

    // this.idleTimeServiceInstance.start();
    this.appObserverServiceInstance.start();
  }

  stop(): void {
    this.idleTimeServiceInstance.stop();
    this.appObserverServiceInstance.stop();
    this.idleTimeServiceInstance.removeAllListeners();
    this.appObserverServiceInstance.removeAllListeners();
  }
}
