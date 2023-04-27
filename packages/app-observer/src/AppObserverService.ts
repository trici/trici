import path from 'path';
import type { Logger } from '@trici/logger';
import { getConsoleLogger, IConsoleLogger } from '@trici/logger';
import config from '@trici/config';
const child_process = require('child_process');
import { EventEmitter } from 'events';
import { Buffer } from 'buffer';

export interface IAppObserverService {
  start(): void;
  stop(): void;
}

export class AppObserverService extends EventEmitter implements IAppObserverService {
  child: any;
  logger: Logger | IConsoleLogger;
  appRoot: string;

  constructor(logger: Logger, appRoot: string) {
    super();
    this.child = null;
    this.logger = logger ? logger : getConsoleLogger();
    this.appRoot = appRoot;
  }

  start(): void {
    const self = this;
    try {
      if (process.platform === "win32") {
        throw new Error("Not implemented");
      } else if (process.platform === 'darwin') {
        const pathToExecutable = config.builtFor === 'dev' ? path.join(this.appRoot, 'bin', 'dev', 'MacFrontmostObserver') : path.join(this.appRoot, 'bin', 'MacFrontmostObserver');
        this.logger.debug("AppObserverService starting:", pathToExecutable);
        this.child = child_process.spawn(pathToExecutable);
        this.logger.info("AppObserverService started:", this.child.pid);
        this.child.stdout.on('data', function (data: Buffer) {
          // console.log(data.toString('utf8'));
          self.emit('frontmostAppChanged', data.toString('utf8'));
      });
      this.child.stderr.on('data', function (data: Buffer) {
          self.logger.error('Error: ' + data.toString('utf8'));
      });
      this.child.on('exit', function (code: number) {
          self.logger.info('Child process exited with code ' + code.toString());
      });
      }
    } catch (error) {
      this.logger.error("AppObserverService failed to start:", error);
    }
  }

  stop(): void {
    this.logger.info("AppObserverService stopping:", this.child.pid);
    // kill the child process
    this.child.kill();

  }
}
