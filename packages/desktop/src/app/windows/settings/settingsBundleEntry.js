import SettingsAppInitialize from "./SettingsAppInitializer";
import log from 'loglevel';
import { LogUtils } from '../../common/LogUtils';

SettingsAppInitialize();

const Config = window.bridgeApi.triciConfig;

if (Config.builtFor === 'prod' || Config.builtFor === 'dev') {
  LogUtils.enableFileLoggingForRendererConsole();
}

window.onerror = function (msg, url, lineNo, columnNo, error) {
  const string = msg.toLowerCase();
  const substring = 'script error';

  const message = [
    `Message: ${msg}`,
    `URL: ${url}`,
    `Line: ${lineNo}`,
    `Column: ${columnNo}`,
    `Error object: ${JSON.stringify(error)}`,
  ].join(' - ');

  log.error(message);
  return false;
};

// trici.log = log;
