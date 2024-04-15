/*
 * The daily user activity model.
 */

import * as Immutable from 'immutable';
import { Constants } from './Constants';
import { AppEvent } from './AppEvent';

interface IDailyUserActivityType {
  _id: string;
  date: number;
  appEvents: Array<AppEvent>;
}

const DailyUserActivitySchema: IDailyUserActivityType = {
  _id: Constants.UNINITIALIZED_ID,
  date: new Date().setHours(0, 0, 0, 0),
  appEvents: [],
};

const DailyUserActivityRecord = Immutable.Record(DailyUserActivitySchema);

export class DailyUserActivity extends DailyUserActivityRecord {
  constructor(dailyUserActivity?: IDailyUserActivityType) {
    if (typeof dailyUserActivity === 'undefined' || dailyUserActivity === null) {
      super({
        _id: Constants.UNINITIALIZED_ID,
        date: new Date().setHours(0, 0, 0, 0),
        appEvents: [],
      });
    } else {
      super({
        _id: dailyUserActivity._id,
        date: dailyUserActivity.date,
        appEvents: dailyUserActivity.appEvents,
      });
    }
  }
}
