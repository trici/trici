import log from 'loglevel';

export default async function () {
  try {
    console.log('EventViewerAppInitialize');
    require('./components/EventViewerRoot');
  } catch (error) {
    log.error(error);
  }
}
