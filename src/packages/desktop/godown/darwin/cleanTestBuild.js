const fs = require('fs-extra');
const { exec } = require('child_process');
/**
 * Cleans the directories created by the test build.
 * remove $HOME/Library/Application Support/TriciTest
 * remove $HOME/Library/Logs/TriciTest
 * remove $HOME/Library/Preferences/com.gettrici.tricitest.plist
 * remove $HOME/Library/Saved Application State/com.gettrici.tricitest.savedState
 * run the tccutil reset command to reset the screen recording permissions for TriciTest
 */
function cleanTestBuild() {
  fs.removeSync(`${process.env.HOME}/Library/Application Support/trici-test`);
  console.log(`Removed ${process.env.HOME}/Library/Application Support/trici-test`);
  fs.removeSync(`${process.env.HOME}/Library/Logs/trici-test`);
  console.log(`Removed ${process.env.HOME}/Library/Logs/trici-test`);
  fs.removeSync(`${process.env.HOME}/Library/Preferences/com.gettrici.trici-test.plist`);
  console.log(`Removed ${process.env.HOME}/Library/Preferences/com.gettrici.trici-test.plist`);
  fs.removeSync(`${process.env.HOME}/Library/Saved Application State/com.gettrici.trici-test.savedState`);
  console.log(`Removed ${process.env.HOME}/Library/Saved Application State/com.gettrici.tricitest.savedState`);
  exec('tccutil reset ScreenCapture com.gettrici.tricitest', (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return;
    }
    console.log(`stdout: ${stdout}`);
    console.error(`stderr: ${stderr}`);
  });
}

cleanTestBuild();
