/// <reference types="node" />
import EventEmitter from "events";
import winston from "winston";
export interface ILoggingService {
    init(logsDirectoryPath: string, logFileNameFormat: string, defaultMeta: any): winston.Logger;
    getLogger(): winston.Logger;
    updateLogLevel(logLevel: string): void;
    changeLoggerDefaultMeta(defaultMeta: any): void;
}
export declare class LoggingService extends EventEmitter implements ILoggingService {
    private logger;
    private transports;
    private logsDirectoryPath;
    private logFileFormat;
    private httpLogFormat;
    private remoteApiEndPoint;
    constructor();
    /**
     * Returns a DailyRotateFile transport
     * @param logFileNameFormat The format of the log file name. E.g. for 'trici-%DATE%.log' the log file name will be 'trici-2019-01-01.log'
     * @returns DailyRotateFile transport
     */
    private _getDailyRotateFileTransport;
    /**
     * Returns the Http transport which logs to a remote endpoint which sends the logs to our AWS CloudWatch
     * @returns Http transport
     */
    private _getHttpTransport;
    init(logsDirectoryPath: string, logFileNameFormat: string, defaultMeta: any): winston.Logger;
    getLogger(): winston.Logger;
    updateLogLevel(logLevel: string): void;
    changeLoggerDefaultMeta(defaultMeta: any): void;
}
//# sourceMappingURL=logger.service.d.ts.map