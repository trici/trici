/**
 * This copies the relevant config file to trici.config.js as a sibling of main.js
 * This is done because we cannot install @trici/config as a dependency to the repo which
 * we are using to create builds. (Since it is a private repo). Perhaps we could have installed
 * using file system linking from the local code, but its just better to copy the file.
 * The thing to remember here is that since the NODE_ENV=production is not set for the packaged app,
 * we have changed the config so that the default config values are of production. But this only works
 * in the bundle. In the unbundled main.js, it has to read the config values and these are not copied by
 * the packager when packing the app because @trici/config is not listed as a dependency in the package.json.
 */

const fs = require('fs-extra');
const path = require('path');

if (process.env.NODE_ENV === 'production') {
  // copy the file from node_modules/@trici/config/trici.config.prod.js to trici.config.js
  const source = path.join(__dirname, '..', 'config', 'src', 'trici.config.prod.js');
  const destination = path.join(__dirname, 'dist', 'trici.config.js');
  fs.copySync(source, destination);
} else if (process.env.NODE_ENV === 'development') {
  const source = path.join(__dirname, '..', 'config', 'src', 'trici.config.dev.js');
  const destination = path.join(__dirname, 'dist', 'trici.config.js');
  fs.copySync(source, destination);
} else if (process.env.NODE_ENV === 'test') {
  throw new Error('Test config not implemented yet');
} else if (process.env.NODE_ENV === 'livedev') {
  const source = path.join(__dirname, '..', 'config', 'src', 'trici.config.live.dev.js');
  const destination = path.join(__dirname, 'dist', 'trici.config.js');
  fs.copySync(source, destination);
}
