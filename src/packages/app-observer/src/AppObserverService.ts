import path from 'path';
import type { Logger } from '@trici/logger';
import { getConsoleLogger, IConsoleLogger } from '@trici/logger';
import config from '@trici/config';
const child_process = require('child_process');
import { EventEmitter } from 'events';
import { Buffer } from 'buffer';
import { isWebBrowser } from '@trici/utils';
import { AppChangeHistoryRecord, AppChangeHistory } from './AppChangeHistory';
import { getInstalledApps as getInstalledAppsUtil, InstalledApp } from './AppObserverUtils';

export interface IAppObserverService {
  start(isRunningInAsar: boolean): void;
  stop(): void;
  getCurrentApp(): { appName: string; appIdentifier: string; timestamp: number } | null;
  getInstalledApps(): Promise<InstalledApp[]>;
  getActiveBrowserOpenedURL(): Promise<string | null>;
}

export type AppObserverResponse = {
  type: string;
  timestamp: number;
  response: any;
};

export class AppObserverService extends EventEmitter implements IAppObserverService {
  child: any;
  getLogger: () => Logger | IConsoleLogger;
  appRoot: string;
  appObserverLogsDirectory: string;
  idleTimeIntervalId: NodeJS.Timeout | null;
  appChangeHistory: AppChangeHistory;
  private pendingRequests: { [type: string]: { resolve: (value: any) => void; reject: (reason?: any) => void } } = {};

  constructor(getLogger: () => Logger | IConsoleLogger, appRoot: string, appObserverLogsDirectory: string) {
    super();
    this.child = null;
    this.getLogger = getLogger;
    this.appRoot = appRoot;
    this.appObserverLogsDirectory = appObserverLogsDirectory;
    this.idleTimeIntervalId = null;
    this.appChangeHistory = new AppChangeHistory();
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
              ? path.join(this.appRoot, '..', 'app.asar.unpacked', 'bin', 'dev', 'triciobserver')
              : path.join(this.appRoot, '..', 'app.asar.unpacked', 'bin', 'triciobserver');
        } else {
          pathToExecutable =
            config.builtFor === 'dev' || config.builtFor === 'livedev'
              ? path.join(this.appRoot, 'bin', 'dev', 'triciobserver')
              : path.join(this.appRoot, 'bin', 'triciobserver');
          this.getLogger().info(`pathToExecutable:${pathToExecutable}`);
        }
        const appEnv = process.env.APP_ENV || 'dev';
        this.child = child_process.spawn(pathToExecutable, [this.appObserverLogsDirectory, appEnv]);
        this.getLogger().info(`AppObserverService started:${this.child.pid}`);
        this.child.stdout.on('data', (data: Buffer) => {
          const rawData = data.toString('utf8');
          try {
            const lines = rawData.split('\n');
            for (const line of lines) {
              if (line.trim() === '') {
                continue;
              }
              const appObserverResponse: AppObserverResponse = JSON.parse(line);
              let frontmostAppChangedData: any = {};
              let appChangeHistoryRecord: AppChangeHistoryRecord = {
                appName: '',
                appIdentifier: '',
                timestamp: 0,
              };

              // Handle pending requests first
              if (appObserverResponse.type in this.pendingRequests) {
                this.pendingRequests[appObserverResponse.type].resolve(appObserverResponse.response);
                delete this.pendingRequests[appObserverResponse.type];
                continue;
              }

              if (appObserverResponse.type === 'frontmostApp') {
                frontmostAppChangedData.timestamp = appObserverResponse.timestamp;
                frontmostAppChangedData.frontmostApp = appObserverResponse.response;

                const previousRecord = self.appChangeHistory.getLatestRecord();
                frontmostAppChangedData.previousApp = previousRecord
                  ? {
                      appName: previousRecord.appName,
                      appIdentifier: previousRecord.appIdentifier,
                    }
                  : null;

                frontmostAppChangedData.previousAppActiveTime = previousRecord
                  ? Math.round(frontmostAppChangedData.timestamp - previousRecord.timestamp)
                  : 0;

                appChangeHistoryRecord.appName = frontmostAppChangedData.frontmostApp.appName;
                appChangeHistoryRecord.appIdentifier = frontmostAppChangedData.frontmostApp.appIdentifier;
                appChangeHistoryRecord.timestamp = frontmostAppChangedData.timestamp;
                self.appChangeHistory.add(appChangeHistoryRecord);

                self.emit('frontmostAppChanged', frontmostAppChangedData);
              } else if (appObserverResponse.type === 'stdLog') {
                self.getLogger().info(`AppObserverService stdLog:${JSON.stringify(appObserverResponse.response)}`);
              } else if (appObserverResponse.type === 'stdError') {
                self.getLogger().error(`AppObserverService stdError:${JSON.stringify(appObserverResponse.response)}`);
              } else if (appObserverResponse.type === 'idleTime') {
                self.emit('idleTime', appObserverResponse.response);
              }
            }
          } catch (error) {
            self.getLogger().info(`Failed to parse appObserverResponse:${rawData}`);
            self.getLogger().error(`AppObserverService failed to parse appObserverResponse:${error}`);
          }
        });
        this.child.stderr.on('data', function (data: Buffer) {
          self.getLogger().error('Error: ' + data.toString('utf8'));
        });
        this.child.on('exit', function (code: number) {
          self.getLogger().info('AppObserver child process exited with code ' + code);
        });
        this.idleTimeIntervalId = setInterval(() => {
          self.child.stdin.write('getSystemIdleTime\n');
        }, 500);
      }
    } catch (error) {
      this.getLogger().error(`AppObserverService failed to start:${error}`);
    }
  }

  stop(): void {
    if (this.idleTimeIntervalId) {
      clearInterval(this.idleTimeIntervalId);
      this.idleTimeIntervalId = null;
    }
    if (!this.child) {
      return;
    }
    this.getLogger().info('AppObserverService stopping:', this.child.pid);
    this.child.kill();
    this.child = null;
  }

  getCurrentApp(): { appName: string; appIdentifier: string; timestamp: number } | null {
    const latestRecord = this.appChangeHistory.getLatestRecord();
    return latestRecord
      ? {
          appName: latestRecord.appName,
          appIdentifier: latestRecord.appIdentifier,
          timestamp: latestRecord.timestamp,
        }
      : null;
  }

  async getInstalledApps(): Promise<InstalledApp[]> {
    return getInstalledAppsUtil();
  }

  async getActiveBrowserOpenedURL(): Promise<string | null> {
    if (!this.child || !this.child.stdin || !this.child.stdout) {
      throw new Error('Child process not initialized.');
    }

    return new Promise<string>((resolve, reject) => {
      this.pendingRequests['activeBrowserOpenedUrlSuccess'] = { resolve, reject };
      this.pendingRequests['activeBrowserOpenedUrlError'] = {
        resolve: value => reject(new Error(value)),
        reject,
      };
      this.child.stdin.write('getActiveBrowserOpenedUrl\n');
    });
  }
}

// export type AppObserverServiceInstance = InstanceType<typeof AppObserverServi
