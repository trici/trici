/*
* The daily user activity model.
*/

import * as Immutable from 'immutable';
import { Constants } from './Constants';


export interface IFrontmostAppData {
  frontmostApp: string;
  becameActiveAt: number;
}

interface IDailyUserActivityType {
  _id: string;
  date: number;
  frontmostAppChanges: Array<IFrontmostAppData>;
}


const DailyUserActivitySchema: IDailyUserActivityType = {
  _id: Constants.UNINITIALIZED_ID,
  date: new Date().setHours(0, 0, 0, 0),
  frontmostAppChanges: [],
};

const DailyUserActivityRecord = Immutable.Record(DailyUserActivitySchema);

export class DailyUserActivity extends DailyUserActivityRecord {
  constructor(dailyUserActivity?: IDailyUserActivityType) {
    if (typeof dailyUserActivity === 'undefined' || dailyUserActivity === null) {
      super({
        _id: Constants.UNINITIALIZED_ID,
        date: new Date().setHours(0, 0, 0, 0),
        frontmostAppChanges: [],
      });
    } else {
      super({
        _id: dailyUserActivity._id,
        date: dailyUserActivity.date,
        frontmostAppChanges: dailyUserActivity.frontmostAppChanges,
      });
    }
  }
}
