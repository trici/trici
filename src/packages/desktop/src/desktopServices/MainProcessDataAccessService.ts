/**
 * MainProcessDataAccessService.ts
 * @description Contains methods to call the repository and return Record objects. TriciRepository does not return Record objects.
 * Thus the methods in this return Record objects. But they do not take Record objects as parameters. They take plain objects.
 * This is done to reduce conversion between Record objects and plain objects since the communication between main and renderer process also happens with plain objects.
 */
import { AppObserverService } from '@trici/app-observer';
import { ITriciDocRepository, IAppEventRepository, IFocusSessionRepository } from '@trici/dal';
import { IConsoleLogger, Logger } from '@trici/logger';
import {
  Constants,
  KeyParts,
  UserPreferences,
  IUserPreferences,
  UsedApplication,
  TriciAppEvent,
  IFocusSession,
  FocusSession,
} from '@trici/models';
import { generateUninitializedTriciId, isWebBrowser } from '@trici/utils';
import { app } from 'electron/main';
import fs from 'fs/promises';
import { IUsedApplicationsService } from './UsedApplicationsService';
/**
 * IMainProcessDataAccessService
 * @description Interface for MainProcessDataAccessService
 */
export interface IMainProcessDataAccessService {
  getUserPreferences(id: string): Promise<UserPreferences>;
  saveUserPreferences(userPreferences: IUserPreferences, idOfDocToDelete: string): Promise<UserPreferences>;
  getInstalledApplications(): Promise<
    { name: string; iconPath: string; bundleIdentifier: string; isBrowser: boolean }[] | []
  >;
  getUsedApplications(): Promise<UsedApplication[]>;
  getTriciAppEvents(fromTime: number, toTime: number, type: TriciAppEvent | null, count: number): Promise<any>;
  getTriciAppEventsForSession(sessionStartTime: number, sessionEndTime: number): Promise<any>;
  getFocusSessionsForDuration(fromTime: number, toTime: number): Promise<Array<FocusSession>>;
  getFocusSessionsPaginated(pageIndex: number, pageSize: number): Promise<Array<FocusSession>>;
  getIdleTimeProfile(sessionStartTime: number): Promise<Buffer>;
}

export class MainProcessDataAccessService implements IMainProcessDataAccessService {
  private _docRepository: ITriciDocRepository;
  private _usedApplicationsService: IUsedApplicationsService;
  private _appEventRepository: IAppEventRepository;
  private _appObserver: AppObserverService;
  private _getLogger: () => Logger | IConsoleLogger;
  private static _instance: MainProcessDataAccessService;
  private _focusSessionRepository: IFocusSessionRepository;
  private constructor(
    repository: ITriciDocRepository,
    usedApplicationsService: IUsedApplicationsService,
    appEventRepository: IAppEventRepository,
    appObserver: AppObserverService,
    focusSessionRepository: IFocusSessionRepository,
    getLogger: () => Logger | IConsoleLogger,
  ) {
    this._docRepository = repository;
    this._usedApplicationsService = usedApplicationsService;
    this._appEventRepository = appEventRepository;
    this._appObserver = appObserver;
    this._focusSessionRepository = focusSessionRepository;
    this._getLogger = getLogger;
  }

  public static getInstance(
    repository: ITriciDocRepository,
    usedApplicationsService: IUsedApplicationsService,
    appEventRepository: IAppEventRepository,
    appObserver: AppObserverService,
    focusSessionRepository: IFocusSessionRepository,
    getLogger: () => Logger | IConsoleLogger,
  ): IMainProcessDataAccessService {
    if (!MainProcessDataAccessService._instance) {
      MainProcessDataAccessService._instance = new MainProcessDataAccessService(
        repository,
        usedApplicationsService,
        appEventRepository,
        appObserver,
        focusSessionRepository,
        getLogger,
      );
    }
    return MainProcessDataAccessService._instance;
  }

  /**
   *
   * @param id The id of the user preferences document
   * @returns A promise that resolves to a UserPreferences object
   * @throws Error
   */
  public async getUserPreferences(id: string): Promise<UserPreferences> {
    try {
      const result = await this._docRepository.get(id);
      console.log('getUserPreferences', result);
      let userPreferences = new UserPreferences(result);
      if (userPreferences._id === Constants.UNINITIALIZED_ID) {
        const correctUnitializedId = generateUninitializedTriciId(installationId, KeyParts.USER_PREFERENCES);
        userPreferences = userPreferences.set('_id', correctUnitializedId);
      }
      return userPreferences;
    } catch (error) {
      this._getLogger().error('Error in getUserPreferences', error);
      throw error;
    }
  }

  /**
   * Saves the user preferences to the database
   * @param userPreferences The user preferences javascript object to save
   * @param idOfDocToDelete The old id of the user preferences document to delete
   * @returns A promise that resolves to a UserPreferences object
   */
  public async saveUserPreferences(
    userPreferences: IUserPreferences,
    idOfDocToDelete: string,
  ): Promise<UserPreferences> {
    try {
      const result = await this._docRepository.save(userPreferences, idOfDocToDelete);
      const savedUserPreferences = new UserPreferences(result);
      global.userPreferences = savedUserPreferences;
      return savedUserPreferences;
    } catch (error) {
      this._getLogger().error('Error in saveUserPreferences', error);
      throw error;
    }
  }

  /**
   * Gets the list of Installed Applications from the system
   * @returns A promise that resolves to an array of InstalledApplication objects
   */
  public async getInstalledApplications(): Promise<
    { name: string; iconPath: string; bundleIdentifier: string; isBrowser: boolean }[] | []
  > {
    let installedApplications: { name: string; iconPath: string; bundleIdentifier: string; isBrowser: boolean }[] | [] =
      [];
    try {
      const cachedResponseFilePath = app.getPath('temp') + '/installedApplications.json';
      // check if the cached response file exists
      let cachedResponseExists = false;
      try {
        await fs.access(cachedResponseFilePath);
        cachedResponseExists = true;
      } catch (error) {
        cachedResponseExists = false;
      }

      console.log('cachedResponseExists: ', cachedResponseExists);

      if (cachedResponseExists) {
        // check when the response was cached and if it is stale, then fetch the data from the system
        // const cachedFile
        const fileStats = await fs.stat(cachedResponseFilePath);
        const fileLastModifiedTime = fileStats.mtimeMs;
        const currentTime = Date.now();
        const timeDifference = currentTime - fileLastModifiedTime;
        const timeDifferenceInMinutes = timeDifference / (1000 * 60);
        if (timeDifferenceInMinutes > 30) {
          cachedResponseExists = false;
        }
      }
      if (!cachedResponseExists) {
        let response = await this._appObserver.getInstalledApps();
        installedApplications = response.map(app => {
          return {
            name: app.name,
            iconPath: app.iconPath,
            bundleIdentifier: app.bundleIdentifier,
            isBrowser: isWebBrowser(app.name),
          };
        });
        // write the response to the file system
        await fs.writeFile(cachedResponseFilePath, JSON.stringify(installedApplications));
      } else {
        // read the response from the file system
        const fileContents = await fs.readFile(cachedResponseFilePath);
        installedApplications = JSON.parse(fileContents.toString());
      }
    } catch (error) {
      this._getLogger().error('Error in getInstalledApplications', error);
      throw error;
    }
    return installedApplications;
  }

  /**
   * Gets the used applications from the database
   */
  public async getUsedApplications(): Promise<UsedApplication[]> {
    try {
      const result = await this._usedApplicationsService.getUsedApplications();
      if (result === null) {
        return [];
      }
      const usedApplications = result.map(app => {
        return new UsedApplication(app);
      });
      return usedApplications;
    } catch (error) {
      this._getLogger().error('Error in getUsedApplications', error);
      throw error;
    }
  }

  /**
   * Gets the Trici App Events from the database
   * @param fromTime The start time of the events
   * @param toTime The end time of the events
   * @param type The type of the events
   */
  public async getTriciAppEvents(
    fromTime: number,
    toTime: number,
    type: TriciAppEvent | null,
    count: number = 20,
  ): Promise<any> {
    try {
      const events = await this._appEventRepository.getAppEvents(fromTime, toTime, type, count);
      return events;
    } catch (error) {
      this._getLogger().error('Error in getTriciAppEvents', error);
      throw error;
    }
  }

  public async getTriciAppEventsForSession(sessionStartTime: number, sessionEndTime: number): Promise<any> {
    try {
      const events = await this._appEventRepository.getAllAppEvents(sessionStartTime, sessionEndTime);
      return events;
    } catch (error) {
      this._getLogger().error('Error in getTriciAppEventsForSession', error);
      throw error;
    }
  }

  public async getFocusSessionsForDuration(fromTime: number, toTime: number): Promise<Array<FocusSession>> {
    try {
      const focusSessions = await this._focusSessionRepository.getFocusSessionsForDuration(fromTime, toTime);
      return focusSessions;
    } catch (error) {
      this._getLogger().error('Error in getFocusSessions', error);
      throw error;
    }
  }

  public async getFocusSessionsPaginated(pageIndex: number, pageSize: number): Promise<Array<FocusSession>> {
    try {
      const focusSessions = await this._focusSessionRepository.getFocusSessionsPaginated(pageIndex, pageSize);
      return focusSessions;
    } catch (error) {
      this._getLogger().error('Error in getFocusSessionsPaginated', error);
      throw error;
    }
  }

  public async getIdleTimeProfile(sessionStartTime: number): Promise<Buffer> {
    try {
      // Read the dat file:
      const filePath =
        global.userDataDirectoryCheckResult.recordingsDir.path +
        '/' +
        sessionStartTime +
        '/' +
        `${sessionStartTime}-itp.dat`;
      const idleTimeProfileBuffer = await fs.readFile(filePath);
      return idleTimeProfileBuffer;
    } catch (error) {
      this._getLogger().error('Error in getIdleTimeProfile', error);
      throw error;
    }
  }
}
