import { AppObserverService } from '@trici/app-observer';
import { IUsedApplication, UsedAppCategory, UsedApplication } from '@trici/models';
import { IAppJsonStorageService } from './AppJsonStorageService';
import { IUsedApplicationRepository } from '@trici/dal';
import { ITriciDesktopService } from 'src/typedefs/ITriciDesktopService';
import { IActionDispatcher } from './ActionDispatcher';
import { TriciAction } from 'src/typedefs/TriciAction';
import { isWebBrowser } from '@trici/utils';

class UsedApplicationsService implements ITriciDesktopService {
  appObserverServiceInstance: AppObserverService;
  appJsonStorageServiceInstance: IAppJsonStorageService;
  repo: IUsedApplicationRepository;
  usedApplications: IUsedApplication[] | null = null;
  isServiceInitialized: boolean = false;
  actionDispatcher: IActionDispatcher<TriciAction>;

  constructor(
    appObserverServiceInstance: AppObserverService,
    appJsonStorageServiceInstance: IAppJsonStorageService,
    repo: IUsedApplicationRepository,
    dispatcher: IActionDispatcher<TriciAction>,
  ) {
    this.appObserverServiceInstance = appObserverServiceInstance;
    this.appJsonStorageServiceInstance = appJsonStorageServiceInstance;
    this.repo = repo;
    this.isServiceInitialized = false;
    this.actionDispatcher = dispatcher;
  }

  registerAppEventHandlers(): void {
    // TODO: Implement any app event handlers here.
  }

  registerActionHandlers(): void {
    this.actionDispatcher.register((action: TriciAction) => {
      switch (action.type) {
        case 'UPDATE_USED_APPLICATIONS':
          console.log('UsedApplicationsService:UPDATE_USED_APPLICATIONS');
          const { usedApplications } = action.args;
          this.updateUsedApplications(usedApplications);
          break;
        default:
          break;
      }
    });
  }

  /**
   * Compares the passed used applications with the used applications in the database.
   * @param usedApplicationRecords These are values that are passed from the onboarding wizard.
   * @returns An array of used applications that need to be inserted .
   */
  getRecordsToBeInserted = (
    usedApplicationRecords: Array<IUsedApplication>,
    usedApplicationsInDb: Array<IUsedApplication>,
  ): Array<IUsedApplication> => {
    const recordsToBeInserted: Array<IUsedApplication> = [];
    usedApplicationRecords.forEach(usedApplicationRecord => {
      const foundAppInDb = usedApplicationsInDb.find(app => app.appIdentifier === usedApplicationRecord.appIdentifier);
      if (foundAppInDb === undefined) {
        // Before adding see if we can auto assign the category.
        const isApplicationAWebBrowser = isWebBrowser(usedApplicationRecord.applicationName);

        if (isApplicationAWebBrowser) {
          usedApplicationRecord.appCategory = UsedAppCategory.COULD_BE_ANYTHING;
        }

        recordsToBeInserted.push(usedApplicationRecord);
      }
    });
    return recordsToBeInserted;
  };

  /**
   * Compares the passed used applications with the used applications in the database. Compared each record and if there are differences, then the record is updated.
   * @param usedApplicationRecords These are values that are passed from the onboarding wizard.
   * @returns An array of used applications that need to be updated.
   */
  getRecordsToBeUpdated = (
    usedApplicationRecords: Array<IUsedApplication>,
    usedApplcationsInDb: Array<IUsedApplication>,
  ): Array<IUsedApplication> => {
    const recordsToBeUpdated: Array<IUsedApplication> = [];
    usedApplicationRecords.forEach(usedApplicationRecord => {
      const foundAppInDb = usedApplcationsInDb.find(app => app.appIdentifier === usedApplicationRecord.appIdentifier);
      if (foundAppInDb !== undefined) {
        if (
          foundAppInDb.appCategory !== usedApplicationRecord.appCategory ||
          foundAppInDb.durationUsed !== usedApplicationRecord.durationUsed ||
          foundAppInDb.iconPath !== usedApplicationRecord.iconPath
        ) {
          recordsToBeUpdated.push(usedApplicationRecord);
        }
      }
    });
    return recordsToBeUpdated;
  };

  /**
   * Updates the used applications in the database.
   * @param usedApplicationRecords These are values that are passed from the onboarding wizard.
   * @returns A promise that resolves to the updated used applications.
   */
  async updateUsedApplications(usedApplicationRecords: Array<IUsedApplication>): Promise<IUsedApplication[]> {
    if (this.isServiceInitialized === false) {
      throw new Error('Service not initialized');
    }
    console.log('UsedApplicationsService.updateUsedApplications.usedApplicationRecords:', usedApplicationRecords);
    if (this.usedApplications) {
      // First, check if there are used applications in the
      const usedApplcationsInDb = await this.repo.getUsedApplications();
      const recordsToBeInserted = this.getRecordsToBeInserted(usedApplicationRecords, usedApplcationsInDb);
      const recordsToBeUpdated = this.getRecordsToBeUpdated(usedApplicationRecords, usedApplcationsInDb);
      console.log('recordsToBeInserted:', recordsToBeInserted);
      console.log('recordsToBeUpdated:', recordsToBeUpdated);
      // Insert the records to be inserted
      if (recordsToBeInserted.length > 0) {
        await this.repo.insertMany(recordsToBeInserted);
      }
      // Update the records to be updated
      if (recordsToBeUpdated.length > 0) {
        for (const record of recordsToBeUpdated) {
          await this.repo.save(record);
        }
      }
      this.usedApplications = await this.repo.getUsedApplications();
      return this.usedApplications;
    } else {
      throw new Error('usedApplications is null');
    }
  }

  async initService(): Promise<void> {
    if (!this.isServiceInitialized) {
      try {
        this.usedApplications = await this.repo.getUsedApplications();
      } catch (error) {
        throw new Error(`Error in getUsedApplications: ${error}`);
      }

      this.registerActionHandlers();
      this.registerAppEventHandlers();

      const onboardingState = global.onboardingState;

      if (onboardingState.onboardingFinished) {
        this.appObserverServiceInstance.on('frontmostAppChanged', appChangeData => {
          if (this.usedApplications) {
            if (appChangeData.previousApp !== '' && appChangeData.previousAppActiveTime !== 0) {
              // Check usedApplications array. If previousApp is present, update the durationUsed.
              // If not present, add a new record.
              const usedApplications = this.usedApplications;
              if (usedApplications) {
                const foundAppRecord = usedApplications.find(
                  usedApplication => usedApplication.appIdentifier === appChangeData.previousApp.appIdentifier,
                );
                if (foundAppRecord) {
                  const foundAppRecordIndex = usedApplications.indexOf(foundAppRecord);
                  foundAppRecord.durationUsed += appChangeData.previousAppActiveTime;
                  usedApplications[foundAppRecordIndex] = foundAppRecord;
                } else {
                  const newUsedApplicationRecord = {
                    applicationName: appChangeData.previousApp.appName,
                    appIdentifier: appChangeData.previousApp.appIdentifier,
                    appCategory: UsedAppCategory.NOT_SET,
                    durationUsed: appChangeData.previousAppActiveTime,
                    iconPath: '',
                  };
                  usedApplications.push(newUsedApplicationRecord);
                }
              } else {
                throw new Error('usedApplications is null');
              }
              this.updateUsedApplications(usedApplications);
            }
          }
          console.log(`UsedApplicationsService:frontmostAppChanged: ${JSON.stringify(appChangeData)}`);
        });
      }
    }
    this.isServiceInitialized = true;
  }

  getAppCategory(currentApplicationIdentifier: string) {
    if (this.usedApplications !== null) {
      const usedApplications = this.usedApplications;
      if (usedApplications) {
        const foundAppRecord = usedApplications.find(
          usedApplication => usedApplication.appIdentifier === currentApplicationIdentifier,
        );
        if (foundAppRecord) {
          return foundAppRecord.appCategory;
        }
      }
      return UsedAppCategory.NOT_SET;
    }

    return UsedAppCategory.NOT_SET;
  }
}

export default UsedApplicationsService;
