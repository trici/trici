// const InitActions = require('../../common/InitialRenderStateValues').InitActions;
// import { InitActions, InitRenderStateValues } from '../../common/InitialRenderStateValues';
import log from 'loglevel';



export default async function () {
  try {
    // await InitActions.initializeUserPreferencesState();
    // log.info("UserPreferencesState initialized");
    // log.info("userPreferences_init:", InitRenderStateValues.getUserPreferences_Init());
    require('./components/SettingsRoot');


  } catch (error) {
    console.error(error);
  }
}
