import log from 'loglevel';

export default async function () {
  try {
    console.log('OnboardingAppInitialize');
    require('./components/OnboardingRoot');
  } catch (error) {
    log.error(error);
  }
}
