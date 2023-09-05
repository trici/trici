// Create a VERSION file which has the version number which is available in package.json and then a new line character.

const fs = require('fs');
const path = require('path');

const packageJson = require('./package.json');

let version = packageJson.version;

version = version + '\n';

const versionFilePath = path.join(__dirname, 'VERSION');

fs.writeFileSync(versionFilePath, version);

console.log(`Build version ${version} successfully written to ${versionFilePath}`);
