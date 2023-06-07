import * as Immutable from 'immutable';
import { Constants } from '@trici/models';

export interface IUserPreferences {
  _id: string;
  defaultScreenToRecord: number;
};

const UserPreferencesSchema: IUserPreferences = {
  _id: Constants.UNINITIALIZED_ID,
  defaultScreenToRecord: Constants.UNINITIALIZED_NUMBER,
};

const UserPreferencesRecord = Immutable.Record(UserPreferencesSchema);

export class UserPreferences extends UserPreferencesRecord {
  constructor(userPreferences?: IUserPreferences) {
    if (typeof userPreferences === 'undefined' || userPreferences === null) {
      super({
        _id: Constants.UNINITIALIZED_ID,
        defaultScreenToRecord: Constants.UNINITIALIZED_NUMBER,
      });
    } else {
      super({
        _id: userPreferences._id,
        defaultScreenToRecord: userPreferences.defaultScreenToRecord,
      });
    }
  }
}
