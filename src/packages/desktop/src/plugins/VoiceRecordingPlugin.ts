import { ITriciPlugin } from '../typedefs/ITriciPlugin';
import { IActionDispatcher } from '../desktopServices/ActionDispatcher';
import { TriciAction } from '../typedefs/TriciAction';
import { WindowManager } from '../desktopServices/WindowManager';
import { TriciRecorder } from '@trici/recorder';
import path from 'path';
import fs from 'fs';

export interface IVoiceRecordingPlugin {
  startRecording(): void;
  stopRecording(): void;
}

export class VoiceRecordingPlugin implements ITriciPlugin, IVoiceRecordingPlugin {
  public name: string = 'VoiceRecordingPlugin';
  public version: string = '1.0.0';
  public description: string = 'Voice recording plugin for Trici';
  private actionDispatcher: IActionDispatcher<TriciAction>;
  private windowManager: WindowManager;
  private recorder: TriciRecorder;
  private isRecording: boolean = false;
  private currentRecordingFileName: string | null = null;

  constructor(actionDispatcher: IActionDispatcher<TriciAction>, windowManager: WindowManager, recorder: TriciRecorder) {
    this.actionDispatcher = actionDispatcher;
    this.windowManager = windowManager;
    this.recorder = recorder;
    this.registerActionHandlers();
  }

  private registerActionHandlers(): void {
    this.actionDispatcher.register((action: TriciAction) => {
      switch (action.type) {
        case 'RECORD_VOICE_NOTE':
          // Toggle recording: if recording, stop; if not recording, start
          if (this.isRecording) {
            this.stopRecording();
          } else {
            this.startRecording();
          }
          break;
        case 'STOP_VOICE_RECORDING':
          this.stopRecording();
          break;
        default:
          break;
      }
    });
  }

  public startRecording(): void {
    if (this.isRecording) {
      console.log('Voice recording already in progress');
      return;
    }

    const recordingFileName = `{Date.now()}`;
    const recordingStorageLocation = path.join(global.userDataDirectoryCheckResult.dataDir.path, 'voice_notes');

    // Ensure recordings directory exists
    if (!fs.existsSync(recordingStorageLocation)) {
      fs.mkdirSync(recordingStorageLocation, { recursive: true });
    }

    try {
      // Start actual voice recording
      this.recorder.startAudioRecording(recordingFileName, recordingStorageLocation);
      this.isRecording = true;
      this.currentRecordingFileName = recordingFileName;

      // Show the voice recording indicator window
      this.actionDispatcher.dispatch({
        type: 'SHOW_VOICE_RECORDING_INDICATOR',
        args: { isRecording: true, recordingFileName },
      });

      console.log('Started voice recording:', recordingFileName);
    } catch (error) {
      console.error('Failed to start voice recording:', error);
      // Hide indicator if recording failed
      this.actionDispatcher.dispatch({
        type: 'HIDE_VOICE_RECORDING_INDICATOR',
        args: { isRecording: false },
      });
    }
  }

  public stopRecording(): void {
    if (!this.isRecording) {
      console.log('No voice recording in progress');
      return;
    }

    try {
      // Stop actual voice recording
      this.recorder.stopAudioRecording();
      this.isRecording = false;
      const fileName = this.currentRecordingFileName;
      this.currentRecordingFileName = null;

      // Hide the voice recording indicator window
      this.actionDispatcher.dispatch({
        type: 'HIDE_VOICE_RECORDING_INDICATOR',
        args: { isRecording: false },
      });

      console.log('Stopped voice recording:', fileName);
    } catch (error) {
      console.error('Failed to stop voice recording:', error);
    }
  }

  public handleEvent(event: any, ...data: any[]): void {
    // This plugin doesn't handle app events, only actions
  }

  public destroy(): void {
    // Stop recording if still active when destroying
    if (this.isRecording) {
      this.stopRecording();
    }
  }
}
