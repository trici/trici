import Immutable from 'immutable';
import { Constants } from './Constants';
import { TRICI_APP_EVENT } from './enums';

export interface IAppEvent {
  id: string;
  type: TRICI_APP_EVENT;
  timestamp: number;
  data: Array<any>;
}

const AppEventSchema: IAppEvent = {
  id: Constants.UNINITIALIZED_ID,
  type: TRICI_APP_EVENT.NOT_SET,
  timestamp: 0,
  data: [],
};

const AppEventRecord = Immutable.Record(AppEventSchema);

export class AppEvent extends AppEventRecord {
  constructor(appEvent?: IAppEvent) {
    if (typeof appEvent === 'undefined' || appEvent === null) {
      super({
        id: Constants.UNINITIALIZED_ID,
        type: TRICI_APP_EVENT.NOT_SET,
        timestamp: 0,
        data: [],
      });
    } else {
      super({
        id: appEvent.id,
        type: appEvent.type,
        timestamp: appEvent.timestamp,
        data: appEvent.data,
      });
    }
  }
}
