import log from 'loglevel';

export default async function () {
  try {
    require('./components/SettingsRoot');
  } catch (error) {
    log.error(error);
  }
}
