import Immutable from 'immutable';
import { UsedAppCategory } from './enums';

export type IUsedApplication = {
  applicationName: string;
  appIdentifier: string;
  appCategory: UsedAppCategory;
  durationUsed: number;
  iconPath?: string;
};

const UsedApplicationSchema: IUsedApplication = {
  applicationName: '',
  appIdentifier: '',
  appCategory: UsedAppCategory.NOT_SET,
  durationUsed: 0,
  iconPath: '',
};

const UsedApplicationRecord = Immutable.Record(UsedApplicationSchema);

export class UsedApplication extends UsedApplicationRecord {
  constructor(usedApplicationRecord?: IUsedApplication) {
    if (typeof usedApplicationRecord === 'undefined' || usedApplicationRecord === null) {
      super({
        applicationName: '',
        appIdentifier: '',
        appCategory: UsedAppCategory.NOT_SET,
        durationUsed: 0,
        iconPath: '',
      });
    } else {
      super({
        applicationName: usedApplicationRecord.applicationName,
        appIdentifier: usedApplicationRecord.appIdentifier,
        appCategory: usedApplicationRecord.appCategory,
        durationUsed: usedApplicationRecord.durationUsed,
        iconPath: usedApplicationRecord.iconPath,
      });
    }
  }
}
