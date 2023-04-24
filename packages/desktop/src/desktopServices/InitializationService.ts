import { app } from "electron";
import config from "@trici/config";
import { ProcessManagerSingleton, IProcessManager } from "@trici/pm";
import TrayService, { ITrayService } from "./TrayService";
import LoggingService from "@trici/logger";
import AppJsonStorageService, { IAppJsonStorageService } from "./AppJsonStorageService";
import type { Logger } from "@trici/logger";
import { AppService, IAppService } from "./AppService";
import { CliMessageHandlerService } from "./CliMessageHandlerService";
import { FocusSessionService } from "./FocusSessionService";
import { TriciRepository } from "@trici/dal";
import IdleTimeService from "./IdleTimeService";

let logger: Logger;
let appJsonStorageService: IAppJsonStorageService;
let trayService: ITrayService;
let processManager: IProcessManager;
let triciApp: IAppService;
let repo: TriciRepository;
let cliMessageHandlerService: CliMessageHandlerService;
let focusSessionService: FocusSessionService;

LoggingService.on("defaultMetaChanged", () => {
  logger = LoggingService.getLogger();
  processManager.updateLogger(logger);
  global.logger = logger;
});

/**
 * Initialize the logger
 */
function initializeLogger() {
  console.log("Initialize logger");
  let dirPath = app.getAppPath() + "/logs";
  if (config.builtFor === "prod") {
    dirPath = app.getPath("appData") + config.logsDirectoryPath;
  }

  logger = LoggingService.init(dirPath, "trici-%DATE%.log", {
    installationId: config.defaultInstallationId,
    appDetails: global.appDetails,
  });
}

export const InitializationService = {
  // This is the main entry point for the desktop app.
  // It is called from main.ts
  // It is responsible for initializing all the services.
  initLogger(): Logger {
    global.appDetails = `${process.platform}-${config.builtFor}-${app.getVersion()}`;
    initializeLogger();
    global.logger = logger;
    return logger;
  },
  async startApp(): Promise<void> {
    try {
      appJsonStorageService = AppJsonStorageService;
      trayService = TrayService;
      processManager = ProcessManagerSingleton.getInstance(logger);
      triciApp = new AppService(processManager, trayService, appJsonStorageService);
      await triciApp.start();
      console.log("global.userDataDirectoryCheckResult: ", global.userDataDirectoryCheckResult);
      console.log(global.userDataDirectoryCheckResult.dataDir.path);
      // Initialize the CLI message handler
      repo = new TriciRepository(logger);
      repo.init(global.userDataDirectoryCheckResult.dataDir.path);
      focusSessionService = new FocusSessionService(repo);
      cliMessageHandlerService = new CliMessageHandlerService(processManager, focusSessionService);
      cliMessageHandlerService.registerCliMessageHandlers();
      IdleTimeService.start();

      // Start the Idletime service
    } catch (error) {
      logger.error("Error while starting the app", error);
      app.quit();
    }
  },
};
