import { UserPreferences } from "@trici/models";
import { IBridgeAPIInterface } from "../../typedefs/preload";
import { RendererRepository } from "../dataaccess/RendererRepository";
// import { getConsoleLogger, IConsoleLogger } from "@trici/logger";


const bridgeApi: IBridgeAPIInterface = window.bridgeApi;
// const logger: IConsoleLogger = getConsoleLogger();

const rendererRepository = RendererRepository.getInstance(bridgeApi);

let userPreferences_Init = new UserPreferences();

async function initializeUserPreferencesState() {
  try {
    userPreferences_Init = await rendererRepository.getUserPreferences();
    console.log('initializeUserPreferencesState-Success:%O', userPreferences_Init);
  } catch (error) {
    console.error('initializeUserPreferencesState-Error:%O', error);
  }
}

function getUserPreferences_Init() {
  return userPreferences_Init;
}

export const InitRenderStateValues = {
  getUserPreferences_Init,
};

export const InitActions = {
  initializeUserPreferencesState,
};
