import { LoggingService } from "./LoggingService";

class LoggingServiceSingleton {
  private static instance: LoggingService;

  private constructor() {
  }

  public static getInstance(): LoggingService {
    if (!LoggingServiceSingleton.instance) {
      LoggingServiceSingleton.instance = new LoggingService();
    }

    return LoggingServiceSingleton.instance;
  }

}

const instance = LoggingServiceSingleton.getInstance();
export default instance;
