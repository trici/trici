// @trici/config/src/index.js

const prodConfig = require('./trici.config.prod');
const devConfig = require('./trici.config.dev');
const testConfig = require('./trici.config.test');

let config;

if (process.env.NODE_ENV === 'production') {
  config = prodConfig;
} else if (process.env.NODE_ENV === 'test') {
  config = testConfig;
} else {
  config =  devConfig;
}

module.exports = config;
