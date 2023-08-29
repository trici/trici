console.log('PostStart.js');

module.exports = async function postStart(forgeConfig, appProcess) {
  console.log(`Spawned child process with pid: ${appProcess.pid}`);
};
