const AppObserverService = require('./dist/index').AppObserverService;
const getConsoleLogger = require('@trici/logger').getConsoleLogger;

console.log("Instantiating AppObserverService...")
const consoleLogger = getConsoleLogger();
const appRoot = __dirname;
const appObserver = new AppObserverService(consoleLogger, appRoot);

appObserver.start();

appObserver.on("frontmostAppChanged", (data) => {
  console.log(data);
});

process.on("SIGINT", () => {
  console.log("SIGINT received.")
  console.log("Stopping AppObserverService...");
  appObserver.stop();
  process.exit();
});

process.on("beforeExit", () => {
  console.log("Stopping AppObserverService...");
  appObserver.stop();
})
