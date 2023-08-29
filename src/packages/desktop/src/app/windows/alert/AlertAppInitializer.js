import log from 'loglevel';

export default async function () {
  try {
    require('./components/AlertRoot');
  } catch (error) {
    log.error(error);
  }
}
