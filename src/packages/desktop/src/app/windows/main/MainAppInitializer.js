import log from 'loglevel';

export default async function () {
  try {
    require('./components/MainRoot');
  } catch (error) {
    log.error(error);
  }
}
