const fs = require('fs-extra');
const path = require('path');
/**
 * Copies the test build from out/TriciTest-darwin-x64/TriciTest.app to /Applications/TriciTest.app
 */

function installTestBuild() {
  const source = path.join(__dirname, 'testBuild', 'TriciTest-darwin-arm64', 'TriciTest.app');
  const destination = '/Applications/TriciTest.app';
  //delete the destination
  fs.removeSync(destination);
  fs.copySync(source, destination);
  console.log(`Copied ${source} to ${destination}`);
}

installTestBuild();
