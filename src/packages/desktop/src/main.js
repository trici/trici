const { performance } = require('perf_hooks');
const { app, ipcMain } = require('electron');
const config = require('./trici.config.js');
const electronUnhandled = require('electron-unhandled');

electronUnhandled({
  showDialog: false,
  logger: error => {
    console.error('ElectronUnhandled', error);
  },
});

global.config = config;

const isRunningInAsar = __dirname.includes('app.asar');
console.log('process.resourcesPath:', process.resourcesPath);

console.log('isRunningInAsar:', isRunningInAsar);

global.isRunningInAsar = isRunningInAsar;

const referencePath = config.mainProcessBuiltModuleReferencePath;

performance.mark('Before require referencePath');
const { initializationService } = require(referencePath);
performance.mark('After require referencePath');

const logger = initializationService.initLogger();

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  logger.info('Another instance of the app is already running. Quitting.');
  app.quit();
}

ipcMain.on('getAppPath', (event, arg) => {
  event.returnValue = app.getAppPath();
});

ipcMain.on('getConfig', (event, arg) => {
  event.returnValue = config;
});

app.once('ready', () => {
  initializationService.startApp();
});
