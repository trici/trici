import * as Immutable from 'immutable';
import { Constants } from './Constants';

export interface ITriciApp {
  installationId: string;
  lastLaunchTime: number;
  lastQuitTime: number;
  hasCompletedOnboarding: boolean;
  setInstallationId(installationId: string): TriciApp;
  setCleanShutdownValues(): TriciApp;
  setLastLaunchTime(): TriciApp;
}

const TriciAppRecord = Immutable.Record({
  installationId: Constants.UNINITIALIZED_ID,
  lastLaunchTime: Date.now(),
  lastQuitTime: -1,
  hasCompletedOnboarding: false,
});

/**
 * The TriciApp model.
 * @description The TriciApp model is used to track the installation of the app. It is saved not in the database, but in a JSON file.
 * It is saved using AppJsonStorageService.
 */
export class TriciApp extends TriciAppRecord implements ITriciApp {
  constructor(triciApp?: TriciApp) {
    if (typeof triciApp === 'undefined' || triciApp === null) {
      super({
        installationId: Constants.UNINITIALIZED_ID,
        lastLaunchTime: Date.now(),
        lastQuitTime: -1,
        hasCompletedOnboarding: false,
      });
    } else {
      super({
        installationId: triciApp.installationId,
        lastLaunchTime: triciApp.lastLaunchTime,
        lastQuitTime: triciApp.lastQuitTime,
        hasCompletedOnboarding: triciApp.hasCompletedOnboarding,
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

  get hasCompletedOnboarding(): boolean {
    return this.get('hasCompletedOnboarding');
  }

  public setInstallationId(installationId: string): TriciApp {
    console.log('generatedInstallationId: ', installationId);
    return this.set('installationId', installationId);
  }

  public setCleanShutdownValues(): TriciApp {
    return this.set('lastQuitTime', Date.now());
  }
  public setLastLaunchTime(): TriciApp {
    return this.set('lastLaunchTime', Date.now());
  }
}
