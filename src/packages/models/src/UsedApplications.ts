import Immutable from 'immutable';
import { UsedAppCategory } from './enums';
import { Constants } from './Constants';

export type UsedApplicationRecord = {
  applicationName: string;
  appCategory: UsedAppCategory;
  durationUsed: number;
};

// const UsedApplicationRecordSchema: IUsedApplicationRecord = {
//   applicationName: '',
//   appCategory: ActiveAppCategory.NOT_SET,
//   durationUsed: 0,
// };

// const UsedApplicationRecordRecord = Immutable.Record(UsedApplicationRecordSchema);

// export class UsedApplicationRecord extends UsedApplicationRecordRecord {
//   constructor(usedApplicationRecord?: IUsedApplicationRecord) {
//     if (typeof usedApplicationRecord === 'undefined' || usedApplicationRecord === null) {
//       super({
//         applicationName: '',
//         appCategory: ActiveAppCategory.NOT_SET,
//         durationUsed: 0,
//       });
//     } else {
//       super({
//         applicationName: usedApplicationRecord.applicationName,
//         appCategory: usedApplicationRecord.appCategory,
//         durationUsed: usedApplicationRecord.durationUsed,
//       });
//     }
//   }
// }

export interface IUsedApplications {
  _id: string;
  records: Array<UsedApplicationRecord>;
}

const UsedApplicationsSchema: IUsedApplications = {
  _id: '',
  records: [],
};

const UsedApplicationsRecord = Immutable.Record(UsedApplicationsSchema);

export class UsedApplications extends UsedApplicationsRecord {
  constructor(usedApplications?: IUsedApplications) {
    if (typeof usedApplications === 'undefined' || usedApplications === null) {
      super({
        _id: Constants.UNINITIALIZED_ID,
        records: [],
      });
    } else {
      super({
        _id: usedApplications._id,
        records: usedApplications.records,
      });
    }
  }
}
