const { performance } = require("perf_hooks");
const { app, ipcMain } = require("electron");
const config = require("@trici/config");
const electronUnhandled = require("electron-unhandled");

electronUnhandled({
  showDialog: false,
  logger: (error) => {
    console.error('ElectronUnhandled', error);
  },
});

global.config = config;

const referencePath = config.mainProcessBuiltModuleReferencePath;

performance.mark("Before require referencePath");
const { initService } = require(referencePath);
performance.mark("After require referencePath");

const logger = initService.initLogger();

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  logger.info("Another instance of the app is already running. Quitting.");
  app.quit();
}

ipcMain.on("getAppPath", (event, arg) => {
  event.returnValue = app.getAppPath();
});

ipcMain.on("getConfig", (event, arg) => {
  event.returnValue = config;
});


app.once("ready", () => {
  initService.startApp();
});
