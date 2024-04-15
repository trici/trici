import EventEmitter from 'events';
import { IAppEventRepository } from '@trici/dal';
import { IAppEvent, AppEvent, getEnumKeyFromValue } from '@trici/models';
import { v4 as uuidv4 } from 'uuid';
import { Constants, TRICI_APP_EVENT } from '@trici/models';

export class AppEventEmitter extends EventEmitter {
  private static instance: AppEventEmitter;
  private _repo: IAppEventRepository | null = null;
  private repoInitialized: boolean = false;

  private constructor() {
    super();
  }

  public static getInstance(): AppEventEmitter {
    if (!AppEventEmitter.instance) {
      AppEventEmitter.instance = new AppEventEmitter();
    }
    return AppEventEmitter.instance;
  }

  private async saveEvent(eventName: string | symbol, ...args: any[]): Promise<void> {
    console.log('AppEventEmitter.saveEvent', eventName, args);
    if (!this.repoInitialized || this._repo === null) {
      throw new Error('AppEventEmitter.saveEvent: repo not initialized');
    }
    const eventTypeKey = getEnumKeyFromValue(TRICI_APP_EVENT, eventName.toString());
    if (eventTypeKey === null) {
      throw new Error(`AppEventEmitter.saveEvent: eventTypeKey is null for eventName ${eventName.toString()}`);
    }
    const eventType = TRICI_APP_EVENT[eventTypeKey];
    let event = new AppEvent();
    const timestamp = Date.now();
    const eventId = uuidv4();
    event = event.withMutations(obj => {
      obj
        .set('id', eventId)
        .set('type', eventType)
        // .set('date', new Date().setHours(0, 0, 0, 0))
        .set('timestamp', timestamp)
        .set('data', args);
    });
    console.log('AppEventEmitter.saveEvent: event to save', event.toJS());
    await this._repo.save(event.toJS() as IAppEvent);
  }

  public emit(eventName: string | symbol, ...args: any[]): boolean {
    console.log('AppEventEmitter.emit', eventName, args);
    if (!this.repoInitialized) {
      throw new Error('AppEventEmitter.emit: repo not initialized');
    }
    this.saveEvent(eventName, ...args);
    return super.emit(eventName, ...args);
  }

  public initializeRepo(repo: IAppEventRepository): void {
    this._repo = repo;
    this.repoInitialized = true;
  }
}
