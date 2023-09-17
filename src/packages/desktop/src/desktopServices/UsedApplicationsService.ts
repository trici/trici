import { AppObserverService } from '@trici/app-observer';
import { Constants, UsedAppCategory, UsedApplications } from '@trici/models';
import { IAppJsonStorageService } from './AppJsonStorageService';
import { ITriciRepository } from '@trici/dal';
import { generateNewTriciId, generateUpdatedTriciId } from '@trici/utils';

class UsedApplicationsService {
  appObserverServiceInstance: AppObserverService;
  appJsonStorageServiceInstance: IAppJsonStorageService;
  repo: ITriciRepository;
  usedApplications: UsedApplications | null = null;

  constructor(
    appObserverServiceInstance: AppObserverService,
    appJsonStorageServiceInstance: IAppJsonStorageService,
    repo: ITriciRepository,
  ) {
    this.appObserverServiceInstance = appObserverServiceInstance;
    this.appJsonStorageServiceInstance = appJsonStorageServiceInstance;
    this.repo = repo;
  }

  async initService(): Promise<void> {
    // Fetches the usedApplications data from the database and sets it to the usedApplications property.
    const lastSavedEntityIds = await this.appJsonStorageServiceInstance.getLastSavedEntityIds();
    const usedApplicationsId = lastSavedEntityIds.usedApplicationsId;

    if (usedApplicationsId === Constants.UNINITIALIZED_ID) {
      this.usedApplications = new UsedApplications();
      const usedApplicationsDocId = generateNewTriciId(global.installationId, 'usedApplications');
      this.usedApplications = this.usedApplications.set('_id', usedApplicationsDocId);
      console.log('UsedApplicationsService:usedApplications: ', this.usedApplications.toJS());
    } else {
      const usedApplicationsResult = await this.repo.get(usedApplicationsId);
      this.usedApplications = new UsedApplications(usedApplicationsResult);
      console.log('UsedApplicationsService:usedApplications: ', this.usedApplications.toJS());
    }

    this.appObserverServiceInstance.on('frontmostAppChanged', appChangeData => {
      if (this.usedApplications) {
        if (appChangeData.previousApp !== '' && appChangeData.previousAppActiveTime !== 0) {
          // Check usedApplications array. If previousApp is present, update the durationUsed.
          // If not present, add a new record.
          const usedApplications = this.usedApplications.records;
          if (usedApplications) {
            const foundAppRecord = usedApplications.find(
              usedApplication => usedApplication.applicationName === appChangeData.previousApp,
            );
            if (foundAppRecord) {
              const foundAppRecordIndex = usedApplications.indexOf(foundAppRecord);
              foundAppRecord.durationUsed += appChangeData.previousAppActiveTime;
              usedApplications[foundAppRecordIndex] = foundAppRecord;
            } else {
              const newUsedApplicationRecord = {
                applicationName: appChangeData.previousApp,
                appCategory: UsedAppCategory.NOT_SET,
                durationUsed: appChangeData.previousAppActiveTime,
              };
              usedApplications.push(newUsedApplicationRecord);
            }
          } else {
            throw new Error('usedApplications is null');
          }
          // Update the usedApplciatons records and save to database.
          const idOfDocToDelete = this.usedApplications.get('_id');
          const updatedId = generateUpdatedTriciId(idOfDocToDelete);
          this.usedApplications = this.usedApplications.withMutations(ua => {
            ua.set('_id', updatedId).set('records', usedApplications);
          });
          this.repo.save(this.usedApplications.toJS(), idOfDocToDelete);
          this.appJsonStorageServiceInstance.updateLastSavedEntityIds('usedApplicationsId', updatedId);
        }
      }

      console.log(`UsedApplicationsService:frontmostAppChanged: ${JSON.stringify(appChangeData)}`);
    });
  }
}

export default UsedApplicationsService;
