import storage from 'electron-json-storage';
import {
  TriciApp,
  LastSavedEntityIds,
  ILastSavedEntityIdsType,
  OnboardingState,
  IOnboardingState,
  ITriciApp,
} from '@trici/models';
import { Constants } from '@trici/models';

export interface IAppJsonStorageService {
  init(): void;
  getTriciAppObject(): Promise<TriciApp>;
  setTriciAppObject(triciApp: TriciApp): Promise<void>;
  getLastSavedEntityIds(): Promise<LastSavedEntityIds>;
  setLastSavedEntityIds(lastSavedEntityIds: LastSavedEntityIds): Promise<void>;
  updateLastSavedEntityIds(fieldToUpdate: keyof ILastSavedEntityIdsType, value: string): Promise<void>;
  getOnboardingState(): Promise<OnboardingState>;
  setOnboardingState(onboardingState: OnboardingState): Promise<void>;
}

class AppJsonStorageService implements IAppJsonStorageService {
  private dataPath: string;

  constructor() {
    this.dataPath = Constants.JSON_STORAGE_PATH;
  }

  public init(): void {
    // storage.setDataPath();
  }

  public async getTriciAppObject(): Promise<TriciApp> {
    return new Promise((resolve, reject) => {
      console.log('getting triciApp');
      console.log(storage);
      storage.get('triciApp', (error, data) => {
        if (error) {
          reject(error);
        }
        console.log('data: ', data);
        let triciApp;
        if (Object.keys(data).length === 0) {
          triciApp = new TriciApp();
        } else {
          triciApp = new TriciApp(data as ITriciApp);
        }
        resolve(triciApp);
      });
    });
  }

  /**
   * Save the TriciApp object into the database.
   * @param triciApp
   * @returns Promise<void>
   */
  public async setTriciAppObject(triciApp: TriciApp): Promise<void> {
    return new Promise((resolve, reject) => {
      storage.set('triciApp', triciApp.toJS(), error => {
        if (error) {
          reject(error);
        }
        resolve();
      });
    });
  }

  /**
   * Get the onboarding state
   * @returns Promise<OnboardingState>
   */
  public async getOnboardingState(): Promise<OnboardingState> {
    return new Promise((resolve, reject) => {
      storage.get('onboardingState', (error, data) => {
        if (error) {
          reject(error);
        } else {
          let onboardingState;
          if (Object.keys(data).length === 0) {
            onboardingState = new OnboardingState();
          } else {
            onboardingState = new OnboardingState(data as IOnboardingState);
          }
          resolve(onboardingState);
        }
      });
    });
  }

  /**
   *  Save the onboarding state
   * @returns Promise<void>
   */
  public async setOnboardingState(onboardingState: OnboardingState): Promise<void> {
    return new Promise((resolve, reject) => {
      storage.set('onboardingState', onboardingState.toJS(), error => {
        if (error) {
          reject(error);
        }
        resolve();
      });
    });
  }

  public async getLastSavedEntityIds(): Promise<LastSavedEntityIds> {
    return new Promise((resolve, reject) => {
      storage.get('lastSavedEntityIds', (error, data) => {
        if (error) {
          reject(error);
        } else {
          let lastSavedEntityIds;
          if (Object.keys(data).length === 0) {
            lastSavedEntityIds = new LastSavedEntityIds();
          } else {
            lastSavedEntityIds = new LastSavedEntityIds(data as ILastSavedEntityIdsType);
          }
          resolve(lastSavedEntityIds);
        }
      });
    });
  }

  public async setLastSavedEntityIds(lastSavedEntityIds: LastSavedEntityIds): Promise<void> {
    return new Promise((resolve, reject) => {
      storage.set('lastSavedEntityIds', lastSavedEntityIds.toJS(), error => {
        if (error) {
          reject(error);
        }
        resolve();
      });
    });
  }

  public async updateLastSavedEntityIds(fieldToUpdate: keyof ILastSavedEntityIdsType, value: string): Promise<void> {
    const lastSavedEntityIds = await this.getLastSavedEntityIds();
    const updatedLastSavedEntityIds = lastSavedEntityIds.set(fieldToUpdate, value);
    await this.setLastSavedEntityIds(updatedLastSavedEntityIds);
  }
}

const instance = new AppJsonStorageService();
instance.init();
export default instance;
