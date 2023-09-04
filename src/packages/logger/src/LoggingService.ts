import EventEmitter from 'events';
import winston, { transport } from 'winston';
import winstonDailyRotateFile from 'winston-daily-rotate-file';
const config = require('@trici/config');
const { format } = winston;
const { combine, timestamp, label, printf, errors } = format;

export interface ILoggingService {
  init(logsDirectoryPath: string, logFileNameFormat: string, defaultMeta: any): winston.Logger;
  getLogger(): winston.Logger;
  updateLogLevel(logLevel: string): void;
  changeLoggerDefaultMeta(defaultMeta: any): void;
  close(): void;
}

export class LoggingService extends EventEmitter implements ILoggingService {
  private logger: winston.Logger | null = null;
  private transports: { console: transport; file: transport; remote: transport } | undefined;
  private logsDirectoryPath: string;
  private logFileFormat: any;
  private logFileNameFormat: string;
  private defaultMeta: any;
  private httpLogFormat: any;
  private remoteApiEndPoint: string = 'api.gettrici.com';
  private loggerDefaultMetaUsesInstallationId: boolean = false;

  constructor() {
    super();
    this.logger = null;
    this.logsDirectoryPath = './logs';
    this.logFileNameFormat = '';

    this.defaultMeta = {};
    this.logFileFormat = printf(({ level, message, label, timestamp, installationId, appDetails }) => {
      return `${timestamp} [${label}] [${installationId}] [${appDetails}] ${level}: ${message} `;
    });
    this.httpLogFormat = printf(
      ({ level, message, appDetails, timestamp, installationId }) =>
        `${timestamp} [${appDetails}] ${installationId} ${level}: ${message}`,
    );
    this.remoteApiEndPoint = 'api.gettrici.com';
    this.loggerDefaultMetaUsesInstallationId = false;
    this.transports = {
      console: new winston.transports.Console({ level: 'info' }),
      file: this._getDailyRotateFileTransport('trici-%DATE%.log'),
      remote: new winston.transports.Http(),
    };
  }

  /**
   * Returns a DailyRotateFile transport
   * @param logFileNameFormat The format of the log file name. E.g. for 'trici-%DATE%.log' the log file name will be 'trici-2019-01-01.log'
   * @returns DailyRotateFile transport
   */
  private _getDailyRotateFileTransport(logFileNameFormat: string): winstonDailyRotateFile {
    return new winstonDailyRotateFile({
      filename: logFileNameFormat,
      dirname: `${this.logsDirectoryPath}`,
      datePattern: 'YYYY-MM-DD-HH',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '7d',
      level: 'info',
      format: combine(errors({ stack: true }), label({ label: 'trici' }), timestamp(), this.logFileFormat),
    });
  }

  /**
   * Returns the Http transport which logs to a remote endpoint which sends the logs to our AWS CloudWatch
   * @returns Http transport
   */
  private _getHttpTransport(): transport {
    return new winston.transports.Http({
      host: this.remoteApiEndPoint,
      port: 443,
      path: '/logClientEvent',
      ssl: true,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `V291bmRzTXlIZWFydFdpdGhBTW9ub3Rvbm91c0xhbmdvdXJKb2huSGFzQUxvbmdNb3VzdGFjaGU=`,
      },
      format: combine(errors({ stack: true }), timestamp(), this.httpLogFormat),
      batch: true,
      batchCount: 10,
    });
  }

  /**
   * Returns the transports config based on the environment
   * @returns The transports config
   * @example
   * const transportsConfig = _getTransportsConfig();
   * // transportsConfig = [DailyRotateFileTransport, HttpTransport]
   */
  private _getTransportsConfig(): any[] {
    if (!this.transports) {
      throw new Error('Transports not initialized');
    }
    let transportsConfig = [];
    if (config.builtFor === 'prod') {
      transportsConfig = [this.transports.file, this.transports.remote];
    } else if (config.builtFor === 'test') {
      transportsConfig = [this.transports.file, this.transports.console];
    } else {
      transportsConfig = [this.transports.file, this.transports.console, this.transports.remote];
    }
    return transportsConfig;
  }

  /**
   * Returns the exception handlers config based on the environment
   * @returns The exception handlers config
   */
  private _getExceptionHandlersTransportsConfig(): any[] {
    if (!this.transports) {
      throw new Error('Transports not initialized');
    }
    let exceptionHandlerTransports = [];
    if (config.builtFor === 'test') {
      exceptionHandlerTransports = [this.transports.file];
    } else {
      exceptionHandlerTransports = [this.transports.file, this.transports.remote];
    }
    return exceptionHandlerTransports;
  }

  /**
   * Initializes the logger
   * @param logsDirectoryPath The path to the directory where the logs will be stored
   * @param logFileNameFormat The format of the log file name. E.g. for 'trici-%DATE%.log' the log file name will be 'trici-2019-01-01.log'
   * @param defaultMeta The default meta data to be added to each log entry (e.g. installationId, appDetails)
   * @returns The logger
   * @example
   * const logger = init('/var/log/trici', 'trici-%DATE%.log', { installationId: '1234', appDetails: 'darwin-dev-2.1.1' });
   * logger.info('Hello world');
   * // 2019-01-01T00:00:00.000Z [trici] [1234] [trici] info: Hello world
   */
  public init(logsDirectoryPath: string, logFileNameFormat: string, defaultMeta: any): winston.Logger {
    console.log('Initializing logger with Config.builtFor: ', config.builtFor);
    if (this.logger) {
      this.logger.info(
        `Logger already initialized for logsDirectoryPath: ${logsDirectoryPath} and defaultMeta: ${defaultMeta}`,
      );
      return this.logger;
    }
    this.logsDirectoryPath = logsDirectoryPath;
    this.logFileNameFormat = logFileNameFormat;
    this.defaultMeta = defaultMeta;

    this.transports = {
      console: new winston.transports.Console({ level: 'info' }),
      file: this._getDailyRotateFileTransport(logFileNameFormat),
      remote: this._getHttpTransport(),
    };

    this.logger = winston.createLogger({
      level: 'info',
      transports: this._getTransportsConfig(),
      exceptionHandlers: this._getExceptionHandlersTransportsConfig(),
      exitOnError: false,
      defaultMeta: defaultMeta,
    });
    this.logger.info('Logger initialized');
    return this.logger;
  }

  public getLogger(): winston.Logger {
    if (!this.logger) {
      throw new Error('Logger not initialized');
    }

    return this.logger;
  }

  public updateLogLevel(logLevel: string): void {
    if (!this.logger) {
      throw new Error('Logger not initialized');
    }

    this.logger.level = logLevel;
  }

  public changeLoggerDefaultMeta(defaultMeta: any): void {
    if (!this.logger) {
      throw new Error('Logger not initialized');
    }
    if (!this.loggerDefaultMetaUsesInstallationId) {
      // update logger config based on installationId
      this.logger.info(`Changing logger default meta to: ${JSON.stringify(defaultMeta)}`);
      this.logger = winston.createLogger({
        level: 'info',
        transports: this._getTransportsConfig(),
        exceptionHandlers: this._getExceptionHandlersTransportsConfig(),
        exitOnError: false,
        defaultMeta: defaultMeta,
      });
      this.loggerDefaultMetaUsesInstallationId = true;
      this.emit('defaultMetaChanged', this.loggerDefaultMetaUsesInstallationId);
    }
  }

  public close(): void {
    if (!this.logger) {
      throw new Error('Logger not initialized');
    }
    this.logger.end();
  }
}
