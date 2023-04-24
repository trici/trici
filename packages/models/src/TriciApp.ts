import * as Immutable from 'immutable';
import { Constants } from './Constants';
import { generateUUIDv5 } from '@trici/utils';

export interface ITriciApp {
  installationId: string;
  lastLaunchTime: number;
  lastQuitTime: number;
  generateInstallationId(): Promise<TriciApp>;
  setCleanShutdownValues(): TriciApp;
  setLastLaunchTime(): TriciApp;
}

const TriciAppRecord = Immutable.Record({
  installationId: Constants.UNINITIALIZED_ID,
  lastLaunchTime: Date.now(),
  lastQuitTime: -1,
});

export class TriciApp extends TriciAppRecord implements ITriciApp{
  constructor(triciApp?: TriciApp) {
    if (typeof triciApp === 'undefined' || triciApp === null) {
      super({
        installationId: Constants.UNINITIALIZED_ID,
        lastLaunchTime: Date.now(),
        lastQuitTime: -1,
      });
    } else {
      super({
        installationId: triciApp.installationId,
        lastLaunchTime: triciApp.lastLaunchTime,
        lastQuitTime: triciApp.lastQuitTime,
      });
    }
  }
  get installationId(): string {
    return this.get('installationId');
  }
  get lastLaunchTime(): number {
    return this.get('lastLaunchTime');
  }
  get lastQuitTime(): number {
    return this.get('lastQuitTime');
  }

  get quitCleanly(): boolean {
    return this.get('lastLaunchTime') < this.get('lastQuitTime');
  }

  public async generateInstallationId(): Promise<TriciApp> {
    const installationId = await generateUUIDv5('triciAppInstallationId');
    console.log("generatedInstallationId: ", installationId);
    return this.set('installationId', installationId);
  }

  public setCleanShutdownValues(): TriciApp {
    return this.set('lastQuitTime', Date.now());
  }
  public setLastLaunchTime(): TriciApp {
    return this.set('lastLaunchTime', Date.now());
  }
}
