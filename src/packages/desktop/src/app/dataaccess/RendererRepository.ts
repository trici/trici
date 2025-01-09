import {
  IUsedApplication,
  IUserPreferences,
  AppEvent,
  TriciAppEvent,
  UsedApplication,
  UserPreferences,
} from '@trici/models';
import { IBridgeAPIInterface } from '../../typedefs/preload';

export interface IRendererRepository {
  getUserPreferences(): Promise<UserPreferences>;
  saveUserPreferences(userPreferences: UserPreferences, idOfDocToDelete: string): Promise<UserPreferences>;
  getCachedUserPreferences(): UserPreferences | null;
  getUsedApplications(): Promise<UsedApplication[]>;
  getEvents(from: number, to: number, type: TriciAppEvent): Promise<AppEvent[]>;
}

/**
 * Class following the Singleton pattern to expose methods to get/save data from/to the database.
 */
export class RendererRepository implements IRendererRepository {
  // private bridgeApi: IBridgeAPIInterface;
  private static instance: RendererRepository;
  private cachedUserPreferences: UserPreferences | null;

  private constructor() {
    console.log('RendererRepository constructor');
    this.cachedUserPreferences = null;
  }

  public static getInstance(): RendererRepository {
    if (!RendererRepository.instance) {
      RendererRepository.instance = new RendererRepository();
    }
    return RendererRepository.instance;
  }

  public getUserPreferences(): Promise<UserPreferences> {
    const self = this;
    return new Promise((fulfill, reject) => {
      const args = {};
      // console.log("this.bridgeApi:%O", this.bridgeApi);
      // console.log("self.bridgeApi:%O", self.bridgeApi);
      window.bridgeApi.query({ handler: 'getUserPreferences', args });
      window.bridgeApi.registerQueryResultHandler((result: { data: IUserPreferences | undefined }) => {
        const userPreferences = new UserPreferences(result.data);
        self.cachedUserPreferences = userPreferences;
        console.log('getUserPreferences-Success:%O', userPreferences);
        fulfill(userPreferences);
      }, 'getUserPreferences-Success');
      window.bridgeApi.registerQueryResultHandler((result: { data: any }) => {
        reject(result.data);
      }, 'getUserPreferences-Error');
    });
  }

  public saveUserPreferences(userPreferences: UserPreferences, idOfDocToDelete: string): Promise<UserPreferences> {
    console.log('RendererRepo.saveUserPreferences:%O', userPreferences);
    return new Promise((fulfill, reject) => {
      const args = {
        userPreferences: userPreferences.toJS(),
        idOfDocToDelete,
      };
      window.bridgeApi.query({ handler: 'saveUserPreferences', args });
      window.bridgeApi.registerQueryResultHandler((result: { data: IUserPreferences | undefined }) => {
        console.log('saveUserPreferences-Success:%O', result.data);
        const userPreferences = new UserPreferences(result.data);
        this.cachedUserPreferences = userPreferences;
        fulfill(userPreferences);
      }, 'saveUserPreferences-Success');
      window.bridgeApi.registerQueryResultHandler((result: { data: any }) => {
        reject(result.data);
      }, 'saveUserPreferences-Error');
    });
  }

  public getCachedUserPreferences(): UserPreferences | null {
    return this.cachedUserPreferences;
  }

  public getUsedApplications(): Promise<UsedApplication[]> {
    return new Promise((fulfill, reject) => {
      const args = {};
      window.bridgeApi.query({ handler: 'getUsedApplications', args });
      window.bridgeApi.registerQueryResultHandler((result: { data: IUsedApplication[] | undefined }) => {
        console.log('getUsedApplications-Success:%O', result.data);
        if (!result.data) {
          reject(new Error('getUsedApplications-Error'));
        } else {
          const usedApplications = result.data.map(app => {
            return new UsedApplication(app);
          });
          fulfill(usedApplications);
        }
      }, 'getUsedApplications-Success');
      window.bridgeApi.registerQueryResultHandler((result: { data: any }) => {
        reject(result.data);
      }, 'getUsedApplications-Error');
    });
  }

  /**
   * Retrieves an array of AppEvents between the specified dates.
   * @param from The start date of the range to retrieve events for.
   * @param to The end date of the range to retrieve events for.
   * @returns A Promise that resolves with an array of AppEvents.
   */
  public getEvents(from: number, to: number, type: TriciAppEvent | null): Promise<AppEvent[]> {
    return new Promise((fulfill, reject) => {
      const args = { from: from, to: to, type: type };
      window.bridgeApi.query({ handler: 'getEvents', args });
      window.bridgeApi.registerQueryResultHandler((result: { data: any[] }) => {
        console.log('getEvents-Success:%O', result.data);
        const events = result.data.map((event: any) => new AppEvent(event));
        fulfill(events);
      }, 'getEvents-Success');
      window.bridgeApi.registerQueryResultHandler((result: { data: any }) => {
        reject(result.data);
      }, 'getEvents-Error');
    });
  }
}
