import { IAppJsonStorageService } from './AppJsonStorageService';
import { ITriciDesktopService } from 'src/typedefs/ITriciDesktopService';
import { AppEventEmitter } from './AppEventEmitter';
import { IActionDispatcher, dispatch } from './ActionDispatcher';
import { TriciAction } from 'src/typedefs/TriciAction';
import { MainProcessIpcMessageSender } from './MainProcessIpcMessageSender';
import permissions from 'node-mac-permissions';

export interface IPermissionsService {
  hasScreenRecordingPermissions(): boolean;
  hasAccessibilityPermissions(): boolean;
  checkScreenRecordingPermissions(): Promise<void>;
  checkAccessisibilityPermissions(): Promise<void>;
  hasMicrophonePermissions(): boolean;
  checkMicrophonePermissions(): Promise<void>;
}

export class PermissionsService implements ITriciDesktopService, IPermissionsService {
  appJsonStorageService: IAppJsonStorageService;
  isServiceInitialized: boolean;
  actionDispatcher: IActionDispatcher<TriciAction>;
  eventBus: AppEventEmitter;
  messageSender: MainProcessIpcMessageSender;

  constructor(
    appJsonStorageService: IAppJsonStorageService,
    actionDispatcher: IActionDispatcher<TriciAction>,
    eventBus: AppEventEmitter,
    messageSender: MainProcessIpcMessageSender,
  ) {
    this.appJsonStorageService = appJsonStorageService;
    this.isServiceInitialized = false;
    this.eventBus = eventBus;
    this.actionDispatcher = actionDispatcher;
    this.messageSender = messageSender;
  }

  private registerActionHandlers(): void {
    this.actionDispatcher.register((action: TriciAction) => {
      switch (action.type) {
        case 'ASK_FOR_SCREEN_RECORDING_PERMISSIONS':
          console.log('Checking for screen recording permissions');
          this.checkScreenRecordingPermissions();
          break;
        case 'ASK_FOR_ACCESSIBILITY_PERMISSIONS':
          console.log('Checking for accessibility permissions');
          this.checkAccessisibilityPermissions();
          break;
        case 'ASK_FOR_MICROPHONE_PERMISSIONS':
          console.log('Checking for microphone permissions');
          this.checkMicrophonePermissions();
          break;
        default:
          break;
      }
    });
  }

  private registerAppEventHandlers(): void {
    console.log('PermissionService.registerAppEventHandlers');
  }

  initService(): void {
    if (!this.isServiceInitialized) {
      this.registerActionHandlers();
      this.registerAppEventHandlers();
      this.isServiceInitialized = true;
    }
  }

  hasScreenRecordingPermissions(): boolean {
    return permissions.getAuthStatus('screen') === 'authorized';
  }

  hasAccessibilityPermissions(): boolean {
    return permissions.getAuthStatus('accessibility') === 'authorized';
  }

  hasMicrophonePermissions(): boolean {
    return permissions.getAuthStatus('microphone') === 'authorized';
  }

  async checkScreenRecordingPermissions(): Promise<void> {
    let onboardingState = await this.appJsonStorageService.getOnboardingState();
    if (!onboardingState.hasAskedForScreenRecordingPermissions) {
      onboardingState = onboardingState.setHasAskedForScreenRecordingPermissions();
      await this.appJsonStorageService.setOnboardingState(onboardingState);
      global.onboardingState = onboardingState;
    }
    // this will trigger the dialog for asking for permission the first time.
    console.log('calling permissions.askForScreenCaptureAccess');
    permissions.askForScreenCaptureAccess(true);
    console.log('after permissions.askForScreenCaptureAccess');
    const screenCapturePermission = this.hasScreenRecordingPermissions();
    console.log('PermissionsService.checkScreenRecordingPermissions', screenCapturePermission);
    if (screenCapturePermission) {
      onboardingState = onboardingState.setHasBeenGivenScreenRecordingPermissions();
      await this.appJsonStorageService.setOnboardingState(onboardingState);
      global.onboardingState = onboardingState;
      this.messageSender.send('onboarding', {
        success: true,
        handler: 'onboardingStateUpdated',
        data: { onboardingState: global.onboardingState.toJS() },
        initValue: false,
      });
      return;
    }
  }

  async checkAccessisibilityPermissions(): Promise<void> {
    let onboardingState = await this.appJsonStorageService.getOnboardingState();
    if (!onboardingState.hasAskedForAccessibilityPermissions) {
      onboardingState = onboardingState.setHasAskedForAccessibilityPermissions();
      await this.appJsonStorageService.setOnboardingState(onboardingState);
      global.onboardingState = onboardingState;
    }
    // this will trigger the dialog for asking for permission the first time.
    console.log('calling permissions.askForAccessibilityAccess');
    permissions.askForAccessibilityAccess();
    console.log('after permissions.askForAccessibilityAccess');
    const accessibilityPermissions = this.hasAccessibilityPermissions();
    console.log('PermissionsService.checkAccessisibilityPermissions', accessibilityPermissions);
    if (accessibilityPermissions) {
      onboardingState = onboardingState.setHasBeenGivenAccessibilityPermissions();
      await this.appJsonStorageService.setOnboardingState(onboardingState);
      global.onboardingState = onboardingState;
      this.messageSender.send('onboarding', {
        success: true,
        handler: 'onboardingStateUpdated',
        data: { onboardingState: global.onboardingState.toJS() },
        initValue: false,
      });
      return;
    }
  }

  async checkMicrophonePermissions(): Promise<void> {
    let onboardingState = await this.appJsonStorageService.getOnboardingState();
    if (!onboardingState.hasAskedForMicrophonePermissions) {
      onboardingState = onboardingState.setHasAskedForMicrophonePermissions();
      await this.appJsonStorageService.setOnboardingState(onboardingState);
      global.onboardingState = onboardingState;
    }
    // this will trigger the dialog for asking for permission the first time.
    console.log('calling permissions.askForMicrophoneAccess');
    const status = await permissions.askForMicrophoneAccess();
    console.log('after permissions.askForMicrophoneAccess', status);
    const micPermission = this.hasMicrophonePermissions();
    console.log('PermissionsService.checkMicrophonePermissions', micPermission);
    if (micPermission) {
      onboardingState = onboardingState.setHasBeenGivenMicrophonePermissions();
      await this.appJsonStorageService.setOnboardingState(onboardingState);
      global.onboardingState = onboardingState;
      this.messageSender.send('onboarding', {
        success: true,
        handler: 'onboardingStateUpdated',
        data: { onboardingState: global.onboardingState.toJS() },
        initValue: false,
      });
      return;
    }
  }
}
