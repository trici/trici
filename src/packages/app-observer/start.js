const AppObserverService = require('./dist/index').AppObserverService;
const getConsoleLogger = require('@trici/logger').getConsoleLogger;

console.log('Instantiating AppObserverService...');
const consoleLogger = getConsoleLogger();
const appRoot = __dirname;
const appObserver = new AppObserverService(consoleLogger, appRoot);

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
