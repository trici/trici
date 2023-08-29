import path from 'path';
import type { Logger } from '@trici/logger';
import { getConsoleLogger, IConsoleLogger } from '@trici/logger';
import config from '@trici/config';
const child_process = require('child_process');
import { EventEmitter } from 'events';
import { Buffer } from 'buffer';

export interface IAppObserverService {
  start(isRunningInAsar: boolean): void;
  stop(): void;
  getCurrentApp(): string;
}

export class AppObserverService extends EventEmitter implements IAppObserverService {
  child: any;
  logger: Logger | IConsoleLogger;
  appRoot: string;
  currentApp: string;

  constructor(logger: Logger, appRoot: string) {
    super();
    this.child = null;
    this.logger = logger ? logger : getConsoleLogger();
    this.appRoot = appRoot;
    this.currentApp = '';
  }

  start(isRunningInAsar = false): void {
    const self = this;
    try {
      if (process.platform === 'win32') {
        throw new Error('Not implemented');
      } else if (process.platform === 'darwin') {
        let pathToExecutable;
        if (isRunningInAsar) {
          pathToExecutable =
            config.builtFor === 'dev' || config.builtFor === 'livedev'
              ? path.join(this.appRoot, '..', 'app.asar.unpacked', 'bin', 'dev', 'MacFrontmostObserver')
              : path.join(this.appRoot, '..', 'app.asar.unpacked', 'bin', 'MacFrontmostObserver');
        } else {
          pathToExecutable =
            config.builtFor === 'dev' || config.builtFor === 'livedev'
              ? path.join(this.appRoot, 'bin', 'dev', 'MacFrontmostObserver')
              : path.join(this.appRoot, 'bin', 'MacFrontmostObserver');
          this.logger.info(`pathToExecutable:${pathToExecutable}`);
        }
        this.logger.info(`AppObserverService starting:${pathToExecutable}`);
        this.child = child_process.spawn(pathToExecutable);
        this.logger.info(`AppObserverService started:${this.child.pid}`);
        this.child.stdout.on('data', function (data: Buffer) {
          const appChangeData = JSON.parse(data.toString('utf8'));
          self.logger.info(`appChangeData:${JSON.stringify(appChangeData)}`);
          self.currentApp = appChangeData.frontmostApp;
          self.emit('frontmostAppChanged', appChangeData);
        });
        this.child.stderr.on('data', function (data: Buffer) {
          self.logger.error('Error: ' + data.toString('utf8'));
        });
        this.child.on('exit', function (code: number) {
          self.logger.info('Child process exited with code ' + code.toString());
        });
      }
    } catch (error) {
      this.logger.error(`AppObserverService failed to start:${error}`);
    }
  }

  stop(): void {
    this.logger.info('AppObserverService stopping:', this.child.pid);
    // kill the child process
    // TOOD: Write code to close the AppObserverService gracefully.
    this.child.kill();
  }

  getCurrentApp(): string {
    return this.currentApp;
  }
}

export type AppObserverServiceInstance = InstanceType<typeof AppObserverService>;
