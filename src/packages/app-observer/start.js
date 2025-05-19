const AppObserverService = require('./dist/index').AppObserverService;
const getConsoleLogger = require('@trici/logger').getConsoleLogger;

console.log('Instantiating AppObserverService...');
const appRoot = __dirname;
const appObserverLogsDirectory = '/Users/shashi/Library/Logs/TriciDev';
const appObserver = new AppObserverService(getConsoleLogger, appRoot, appObserverLogsDirectory);

appObserver.start();

console.log(
  '\u001b[1m\u001b[33m⬤⬤⬤ Dont forget to run updbin in desktop package to update binary in desktop package. ⬤⬤⬤\u001b[0m',
);

const message = 'Run updbin in desktop package to update binary in desktop package.';
const decoration = '*'.repeat(message.length + 4); // +4 to account for the additional asterisks

console.log(`${decoration}\n* ${message} *\n${decoration}`);

const updString = '\x1b[1m\x1b[33mRun updbin in desktop package to update binary in desktop package.\x1b[0m';
appObserver.on('frontmostAppChanged', data => {
  console.log(data);
});

appObserver.on('idleTime', data => {
  console.log(data);
});

console.log('Calling getActiveBrowserOpenedURL in 3 seconds...');
setInterval(() => {
  appObserver
    .getActiveBrowserOpenedURL()
    .then(url => {
      console.log('Active browser opened URL:', url);
    })
    .catch(error => {
      console.error('Error getting active browser opened URL:', error);
    });
}, 3000);

//console.log('Getting installed apps...');
//appObserver.getInstalledApps().then(apps => {
// console.log(apps);
//});

process.on('SIGINT', () => {
  console.log('SIGINT received.');
  console.log('Stopping AppObserverService...');
  appObserver.stop();
  process.exit();
});

process.on('beforeExit', () => {
  console.log('Stopping AppObserverService...');
  appObserver.stop();
});
