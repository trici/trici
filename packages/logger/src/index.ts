import loggingService from './LoggingServiceSingleton';

export { ILoggingService } from './LoggingService';
export default loggingService;
export type { Logger } from 'winston';

export interface IConsoleLogger {
  error: (...args: any[]) => void;
  warn: (...args: any[]) => void;
  log: (...args: any[]) => void;
  info: (...args: any[]) => void;
  verbose: (...args: any[]) => void;
  debug: (...args: any[]) => void;
}

export function getConsoleLogger(): IConsoleLogger {
    const consoleLogger = {
      error: console.error,
      warn: console.warn,
      log: console.log,
      info: console.info,
      verbose: console.debug,
      debug: console.debug
    };
    return consoleLogger;
}
