import log from 'loglevel';

export default async function () {
  try {
    require('./components/TriciRoot');
  } catch (error) {
    log.error(error);
  }
}
