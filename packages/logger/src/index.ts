import { LoggingService } from './logger.service';

const loggingService = new LoggingService();

export const init = loggingService.init.bind(loggingService);
export const getLogger = loggingService.getLogger.bind(loggingService);
export const updateLogLevel = loggingService.updateLogLevel.bind(loggingService);
export const changeLoggerConfig = loggingService.changeLoggerDefaultMeta.bind(loggingService);

export { ILoggingService } from './logger.service';
