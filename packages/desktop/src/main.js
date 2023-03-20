const { app } = require('electron');

console.log("Hello from Trici Desktop");
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
    app.quit();
}