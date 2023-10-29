/**
 * MainProcessDataAccessService.ts
 * @description Contains methods to call the repository and return Record objects. TriciRepository does not return Record objects.
 * Thus the methods in this return Record objects. But they do not take Record objects as parameters. They take plain objects.
 * This is done to reduce conversion between Record objects and plain objects since the communication between main and renderer process also happens with plain objects.
 */
import { AppObserverService } from '@trici/app-observer';
import { ITriciRepository } from '@trici/dal';
import { Logger } from '@trici/logger';
import { Constants, KEY_PARTS, UserPreferences, IUserPreferences, UsedApplications } from '@trici/models';
import { generateUninitializedTriciId } from '@trici/utils';
import { app } from 'electron/main';
import fs from 'fs/promises';
/**
 * IMainProcessDataAccessService
 * @description Interface for MainProcessDataAccessService
 */
export interface IMainProcessDataAccessService {
  getUserPreferences(id: string): Promise<UserPreferences>;
  saveUserPreferences(userPreferences: UserPreferences, idOfDocToDelete: string): Promise<UserPreferences>;
  getInstalledApplications(): Promise<[{ name: string; iconPath: string }] | []>;
  saveUsedApplications(usedApplications: UsedApplications, idOfDocToDelete: string): Promise<UsedApplications>;
}

export class MainProcessDataAccessService implements IMainProcessDataAccessService {
  private _repository: ITriciRepository;
  private _appObserver: AppObserverService;
  private _logger: Logger;
  private static _instance: MainProcessDataAccessService;

  private constructor(repository: ITriciRepository, appObserver: AppObserverService, logger: Logger) {
    this._repository = repository;
    this._appObserver = appObserver;
    this._logger = logger;
  }

  public static getInstance(
    repository: ITriciRepository,
    appObserver: AppObserverService,
    logger: Logger,
  ): MainProcessDataAccessService {
    if (!MainProcessDataAccessService._instance) {
      MainProcessDataAccessService._instance = new MainProcessDataAccessService(repository, appObserver, logger);
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
      const result = await this._repository.get(id);
      console.log('getUserPreferences', result);
      let userPreferences = new UserPreferences(result);
      if (userPreferences._id === Constants.UNINITIALIZED_ID) {
        const correctUnitializedId = generateUninitializedTriciId(installationId, KEY_PARTS.USER_PREFERENCES);
        userPreferences = userPreferences.set('_id', correctUnitializedId);
      }
      return userPreferences;
    } catch (error) {
      logger.error('Error in getUserPreferences', error);
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
      const result = await this._repository.save(userPreferences, idOfDocToDelete);
      const savedUserPreferences = new UserPreferences(result);
      global.userPreferences = savedUserPreferences;
      return savedUserPreferences;
    } catch (error) {
      logger.error('Error in saveUserPreferences', error);
      throw error;
    }
  }

  /**
   * Gets the list of Installed Applications from the system
   * @returns A promise that resolves to an array of InstalledApplication objects
   */
  public async getInstalledApplications(): Promise<[{ name: string; iconPath: string }] | []> {
    let installedApplications: [{ name: string; iconPath: string }] | [] = [];
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
        installedApplications = await this._appObserver.getInstalledApps();
        // write the response to the file system
        await fs.writeFile(cachedResponseFilePath, JSON.stringify(installedApplications));
      } else {
        // read the response from the file system
        const fileContents = await fs.readFile(cachedResponseFilePath);
        installedApplications = JSON.parse(fileContents.toString());
      }
    } catch (error) {
      logger.error('Error in getInstalledApplications', error);
      throw error;
    }
    return installedApplications;
  }

  /**
   * Saves the used applications to the database
   * @summary This is added here as the used applications are sent from the renderer process and then saved to the database.
   * It is not leveraging any logic in the UsedApplicationsService.
   */
  public async saveUsedApplications(
    usedApplications: UsedApplications,
    idOfDocToDelete: string,
  ): Promise<UsedApplications> {
    try {
      const result = await this._repository.save(usedApplications, idOfDocToDelete);
      const savedUsedApplications = new UsedApplications(result);
      return savedUsedApplications;
    } catch (error) {
      logger.error('Error in saveUsedApplications', error);
      throw error;
    }
  }
}
