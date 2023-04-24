import storage from 'electron-json-storage';
import { TriciApp } from '@trici/models';
import { Constants } from '@trici/models';
import { app } from 'electron';

export interface IAppJsonStorageService {
  init(): void;
  getTriciAppObject(): Promise<TriciApp>;
  setTriciAppObject(triciApp: TriciApp): Promise<void>;
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
      storage.get('triciApp', (error, data) => {
        if (error) {
          reject(error);
        }
        console.log("data: ", data);
        let triciApp;
        if (Object.keys(data).length === 0) {
          triciApp = new TriciApp();
        } else {
          triciApp = new TriciApp(data);
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
      storage.set('triciApp', triciApp, (error) => {
        if (error) {
          reject(error);
        }
        resolve();
      });
    });
  }
}

const instance = new AppJsonStorageService();
instance.init();
export default instance;
