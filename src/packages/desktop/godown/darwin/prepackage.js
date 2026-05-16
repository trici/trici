/**
 * This script is used to change the package name before packaging.
  */
const fs = require('fs');
const packageJson = require('./package.json');

const buildEnv = process.env.BUILD_ENV;

if (buildEnv === 'test') {
  packageJson.name = 'trici-test';
} else {
  packageJson.name = 'trici';
}

fs.writeFileSync('./package.json', JSON.stringify(packageJson, null, 2));

