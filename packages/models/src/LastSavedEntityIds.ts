import { Constants } from './Constants';
import * as Immutable from 'immutable';

export interface ILastSavedEntityIdsType {
  todayUserActivityId: string;
};

const LastSavedEntityIdsSchema: ILastSavedEntityIdsType = {
  todayUserActivityId: Constants.UNINITIALIZED_ID,
};

const LastSavedEntityIdsRecord = Immutable.Record(LastSavedEntityIdsSchema);

/**
 * The last saved entity ids model.
 * @description The last saved entity ids model is used to track the last saved entity ids. It is saved not in the database, but in a JSON file.
 * It is saved using AppJsonStorageService.
 */
export class LastSavedEntityIds extends LastSavedEntityIdsRecord {
  constructor(lastSavedEntityIds?: ILastSavedEntityIdsType) {
    if (typeof lastSavedEntityIds === 'undefined' || lastSavedEntityIds === null) {
      super({
        todayUserActivityId: Constants.UNINITIALIZED_ID,
      });
    } else {
      super({
        todayUserActivityId: lastSavedEntityIds.todayUserActivityId,
      });
    }
  }
}
