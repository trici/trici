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
  getInstalledApps(): Promise<[{ name: string; iconPath: string }]>;
}

export type AppObserverResponse = {
  type: string;
  timestamp: number;
  response: any;
};

export class AppObserverService extends EventEmitter implements IAppObserverService {
  child: any;
  logger: Logger | IConsoleLogger;
  appRoot: string;
  currentApp: string;
  currentAppActiveStartTime: number;

  constructor(logger: Logger, appRoot: string) {
    super();
    this.child = null;
    this.logger = logger ? logger : getConsoleLogger();
    this.appRoot = appRoot;
    this.currentApp = '';
    this.currentAppActiveStartTime = 0;
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
          const appObserverResponse: AppObserverResponse = JSON.parse(data.toString('utf8'));
          let appChangeData: any = {};
          if (appObserverResponse.type === 'frontmostApp') {
            appChangeData.timestamp = appObserverResponse.timestamp;
            appChangeData.frontmostApp = appObserverResponse.response;
            appChangeData.previousApp = self.currentApp;
            appChangeData.previousAppActiveTime =
              self.currentAppActiveStartTime > 0
                ? Math.round(appChangeData.timestamp - self.currentAppActiveStartTime)
                : 0;
            // self.logger.info(`appChangeData:${JSON.stringify(appChangeData)}`);
            self.currentApp = appObserverResponse.response;
            self.currentAppActiveStartTime = appObserverResponse.timestamp;
            self.emit('frontmostAppChanged', appChangeData);
          }
        });
        this.child.stderr.on('data', function (data: Buffer) {
          self.logger.error('Error: ' + data.toString('utf8'));
        });
        this.child.on('exit', function (code: number) {
          self.logger.info('AppObserver child process exited with code ' + code);
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

  async getInstalledApps(): Promise<[{ name: string; iconPath: string }]> {
    if (!this.child || !this.child.stdin || !this.child.stdout) {
      throw new Error('Child process not initialized.');
    }

    return new Promise<[{ name: string; iconPath: string }]>((resolve, reject) => {
      // Create a listener for stdout to handle the installed apps response.
      const responseHandler = (data: Buffer) => {
        try {
          const appObserverResponse: AppObserverResponse = JSON.parse(data.toString('utf8'));
          console.log('getInstalledApps response:', JSON.stringify(appObserverResponse));
          if (appObserverResponse.type === 'installedApps') {
            // Remove the listener once we've received the response.
            this.child.stdout.off('data', responseHandler);

            if (appObserverResponse.response.length > 0) {
              // iterate through the response and pick name and iconPath properties.
              const appsList = appObserverResponse.response.map((app: any) => {
                return { name: app.name, iconPath: app.iconPath };
              });
              resolve(appsList);
            } else {
              reject(new Error('No apps found.'));
            }
          }
        } catch (error) {
          reject(error);
        }
      };

      this.child.stdout.on('data', responseHandler);

      // Send the command to the Swift app to get installed apps.
      this.child.stdin.write('getInstalledApps\n');
    });
  }
}

// export type AppObserverServiceInstance = InstanceType<typeof AppObserverService>;
