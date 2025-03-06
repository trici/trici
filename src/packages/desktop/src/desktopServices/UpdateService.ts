import { autoUpdater } from 'electron';
import { Logger } from '@trici/logger';

interface UpdateInfo {
  version: string;
  pub_date: string;
  notes: string;
  name: string;
  url: string;
}

interface ReleaseInfo {
  version: string;
  updateTo: UpdateInfo;
}

interface ReleasesJson {
  currentRelease: string;
  releases: ReleaseInfo[];
}

export class UpdateService {
  private static instance: UpdateService;
  private updateServerUrl: string;
  private isInitialized: boolean = false;
  private logger: Logger;
  private isUpdateServerReachable: boolean = true;

  private getUpdateServerUrl(): string {
    let feedUrl = '';
    if (process.platform === 'darwin') {
      const macAutoUpdateFeedUrl = 'https://download.gettrici.com/darwin/releases.json';
      const macAutoUpdateFeedUrlArm64 = 'https://download.gettrici.com/darwin/releases-arm64.json';
      feedUrl = process.arch === 'arm64' ? macAutoUpdateFeedUrlArm64 : macAutoUpdateFeedUrl;
    } else if (process.platform === 'win32') {
      feedUrl = 'https://download.gettrici.com/win/releases.json';
    }

    return feedUrl;
  }

  private constructor(logger: Logger) {
    this.logger = logger;
    this.updateServerUrl = this.getUpdateServerUrl();
  }

  public static getInstance(logger: Logger): UpdateService {
    if (!UpdateService.instance) {
      UpdateService.instance = new UpdateService(logger);
    }
    return UpdateService.instance;
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    if (process.platform !== 'darwin') {
      this.logger.info('Auto updates are only supported on macOS');
      return;
    }

    try {
      // Configure autoUpdater
      autoUpdater.setFeedURL({
        url: this.updateServerUrl,
        serverType: 'json',
      });

      // Set up event handlers
      autoUpdater.on('checking-for-update', () => {
        this.logger.info('Checking for updates...');
      });

      autoUpdater.on('update-available', (event: Electron.Event) => {
        this.logger.info('Update available');
        this.isUpdateServerReachable = true;
      });

      autoUpdater.on('update-not-available', (event: Electron.Event) => {
        this.logger.info('Update not available');
        this.isUpdateServerReachable = true;
      });

      autoUpdater.on('error', (err: Error) => {
        this.logger.error('Error in auto-updater:', err);
        this.isUpdateServerReachable = false;
      });

      autoUpdater.on('update-downloaded', (event: Electron.Event) => {
        this.logger.info('Update downloaded. Notifying the app to install the update');
        // Restart the app to install the update
        // autoUpdater.quitAndInstall();
      });

      this.isInitialized = true;
      this.logger.info('Update service initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize update service:', error);
      this.isUpdateServerReachable = false;
      // Don't throw the error, just log it
    }
  }

  public async checkForUpdates(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      await autoUpdater.checkForUpdates();
    } catch (error) {
      this.logger.error('Failed to check for updates:', error);
      this.isUpdateServerReachable = false;
      // Don't throw the error, just log it
    }
  }

  public async quitAndInstall(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      await autoUpdater.quitAndInstall();
    } catch (error) {
      this.logger.error('Failed to quit and install update:', error);
      // Don't throw the error, just log it
    }
  }

  public isServerReachable(): boolean {
    return this.isUpdateServerReachable;
  }
}
