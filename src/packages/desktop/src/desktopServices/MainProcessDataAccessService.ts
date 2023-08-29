/**
 * MainProcessDataAccessService.ts
 * @description Contains methods to call the repository and return Record objects. TriciRepository does not return Record objects.
 * Thus the methods in this return Record objects. But they do not take Record objects as parameters. They take plain objects.
 * This is done to reduce conversion between Record objects and plain objects since the communication between main and renderer process also happens with plain objects.
 */
import { ITriciRepository } from '@trici/dal';
import { Constants, KEY_PARTS, UserPreferences, IUserPreferences } from '@trici/models';
import { generateUninitializedTriciId } from '@trici/utils';

/**
 * IMainProcessDataAccessService
 * @description Interface for MainProcessDataAccessService
 */
export interface IMainProcessDataAccessService {
  getUserPreferences(id: string): Promise<UserPreferences>;
  saveUserPreferences(userPreferences: UserPreferences, idOfDocToDelete: string): Promise<UserPreferences>;
}

export class MainProcessDataAccessService implements IMainProcessDataAccessService {
  private _repository: ITriciRepository;
  private static _instance: MainProcessDataAccessService;

  private constructor(repository: ITriciRepository) {
    this._repository = repository;
  }

  public static getInstance(repository: ITriciRepository): MainProcessDataAccessService {
    if (!MainProcessDataAccessService._instance) {
      MainProcessDataAccessService._instance = new MainProcessDataAccessService(repository);
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
      throw error;
    }
  }
}
