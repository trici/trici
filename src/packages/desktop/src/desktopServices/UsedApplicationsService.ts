import { AppObserverService } from '@trici/app-observer';
import { Constants, UsedAppCategory, UsedApplicationRecord, UsedApplications } from '@trici/models';
import { IAppJsonStorageService } from './AppJsonStorageService';
import { ITriciRepository } from '@trici/dal';
import { generateNewTriciId, generateUpdatedTriciId } from '@trici/utils';
import { ITriciDesktopService } from 'src/typedefs/ITriciDesktopService';
import { IActionDispatcher } from './ActionDispatcher';
import { TriciAction } from 'src/typedefs/TriciAction';

class UsedApplicationsService implements ITriciDesktopService {
  appObserverServiceInstance: AppObserverService;
  appJsonStorageServiceInstance: IAppJsonStorageService;
  repo: ITriciRepository;
  usedApplications: UsedApplications | null = null;
  isServiceInitialized: boolean = false;
  actionDispatcher: IActionDispatcher<TriciAction>;

  constructor(
    appObserverServiceInstance: AppObserverService,
    appJsonStorageServiceInstance: IAppJsonStorageService,
    repo: ITriciRepository,
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

  updateUsedApplications(usedApplicationRecords: Array<UsedApplicationRecord>): Promise<UsedApplications> {
    return new Promise((resolve, reject) => {
      if (this.isServiceInitialized === false) {
        reject(new Error('Service not initialized'));
      }
      if (this.usedApplications) {
        const idOfDocToDelete = this.usedApplications.get('_id');
        const updatedId = generateUpdatedTriciId(idOfDocToDelete);
        this.usedApplications = this.usedApplications.withMutations(ua => {
          ua.set('_id', updatedId).set('records', usedApplicationRecords);
        });
        this.repo.save(this.usedApplications.toJS(), idOfDocToDelete);
        this.appJsonStorageServiceInstance.updateLastSavedEntityIds('usedApplicationsId', updatedId);
        resolve(this.usedApplications);
      } else {
        reject(new Error('usedApplications is null'));
      }
    });
  }

  async initService(): Promise<void> {
    if (!this.isServiceInitialized) {
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

      this.registerActionHandlers();
      this.registerAppEventHandlers();

      const onboardingState = global.onboardingState;

      if (onboardingState.onboardingFinished) {
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
}

export default UsedApplicationsService;
