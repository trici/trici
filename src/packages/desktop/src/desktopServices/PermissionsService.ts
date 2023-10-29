import {
  hasScreenCapturePermission,
  hasPromptedForPermission,
  openSystemPreferences,
} from 'mac-screen-capture-permissions';
import { IAppJsonStorageService } from './AppJsonStorageService';
import { ITriciDesktopService } from 'src/typedefs/ITriciDesktopService';
import { AppEventEmitter } from './AppEventEmitter';
import { IActionDispatcher, dispatch } from './ActionDispatcher';
import { TriciAction } from 'src/typedefs/TriciAction';
import { TRICI_APP_EVENT } from '@trici/models';
import { MainProcessIpcMessageSender } from './MainProcessIpcMessageSender';
import { on } from 'events';

export interface IPermissionsService {
  hasScreenRecordingPermissions(): boolean;
  hasAccessibilityPermissions(): boolean;
  checkScreenRecordingPermissions(): Promise<void>;
  requestAccessibilityPermissions(): Promise<void>;
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
    return hasScreenCapturePermission();
  }

  hasAccessibilityPermissions(): boolean {
    throw new Error('Method not implemented.');
  }

  async checkScreenRecordingPermissions(): Promise<void> {
    let onboardingState = await this.appJsonStorageService.getOnboardingState();
    let promptForPermissionWillShow = false;
    if (!onboardingState.hasAskedForScreenRecordingPermissions) {
      promptForPermissionWillShow = !hasPromptedForPermission();
      onboardingState = onboardingState.setHasAskedForScreenRecordingPermissions();
      await this.appJsonStorageService.setOnboardingState(onboardingState);
      global.onboardingState = onboardingState;
    }
    // this will trigger the dialog for asking for permission the first time.
    const screenCapturePermission = hasScreenCapturePermission();
    console.log('PermissionService.checkScreenRecordingPermissions', screenCapturePermission);
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

      // this.eventBus.emit(TRICI_APP_EVENT.SCREEN_RECORDING_PERMISSION_GRANTED, triciApp);

      return;
    } else {
      dispatch({
        type: 'OPEN_SYSTEM_PREFERENCES',
      });
      dispatch({
        type: 'CLOSE_ONBOARDING_WINDOW',
      });
    }
  }

  async requestAccessibilityPermissions(): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
