import EventEmitter from 'events';


export class AppEventEmitter extends EventEmitter {
  private static instance: AppEventEmitter;

  private constructor() {
    super();
  }

  public static getInstance(): AppEventEmitter {
    if (!AppEventEmitter.instance) {
      AppEventEmitter.instance = new AppEventEmitter();
    }
    return AppEventEmitter.instance;
  }

  public emit(eventName: string | symbol, ...args: any[]): boolean {
    console.log("AppEventEmitter.emit", eventName, args);
    return super.emit(eventName, ...args);
  }

}



