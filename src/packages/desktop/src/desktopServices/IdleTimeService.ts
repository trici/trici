import { powerMonitor } from 'electron';
import EventEmitter from 'events';

// This service simply emits triciping events at given interval.

class IdleTimeServiceClass extends EventEmitter {
  timerIntervalId: NodeJS.Timeout | null;

  constructor() {
    super();
    this.timerIntervalId = null;
  }

  // I want triciPing to be within the IdleTimeServiceClass so that I can emit associated events.
  triciPing = function (self: IdleTimeServiceClass) {
    const idleTime = powerMonitor.getSystemIdleTime();
    self.emit('triciping', idleTime);
  };

  start: Function = () => {
    const self = this;
    console.log('Starting IdleTimeService');
    this.timerIntervalId = setInterval(() => {
      self.triciPing(self);
    }, 500);
  };

  stop: Function = () => {
    console.log('Stopping IdleTimeService');
    if (this.timerIntervalId !== null) {
      clearInterval(this.timerIntervalId);
      this.timerIntervalId = null;
    }
  };
}

export type IdleTimeServiceInstance = InstanceType<typeof IdleTimeServiceClass>;
class IdleTimeServiceSingleton {
  private static instance: IdleTimeServiceClass;

  static getInstance(): IdleTimeServiceClass {
    if (!IdleTimeServiceSingleton.instance) {
      IdleTimeServiceSingleton.instance = new IdleTimeServiceClass();
    }
    return IdleTimeServiceSingleton.instance;
  }
}
export default IdleTimeServiceSingleton.getInstance();
