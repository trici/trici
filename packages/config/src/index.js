// @trici/config/src/index.js

const prodConfig = require('./trici.config.prod');
const devConfig = require('./trici.config.dev');
const testConfig = require('./trici.config.test');
const liveDevConfig = require('./trici.config.live.dev');

let config;

if (process.env.NODE_ENV === 'production') {
  config = prodConfig;
} else if (process.env.NODE_ENV === 'test') {
  config = testConfig;
} else if (process.env.NODE_ENV === 'livedev') {
  config = liveDevConfig;
} else {
  config =  devConfig;
}

module.exports = config;
