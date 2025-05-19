import { TriciAppEvent, SessionTrigger } from '@trici/models';
import { TriciRecorder } from '@trici/recorder';
import { ITriciPlugin } from '../typedefs/ITriciPlugin';
import { dispatch } from '../desktopServices/ActionDispatcher';
import type { FocusSession } from '@trici/models';
import { app } from 'electron';
import path from 'path';
import fs from 'fs';

export class ScreenRecordingPlugin implements ITriciPlugin {
  public name: string = 'ScreenRecordingPlugin';
  public version: string = '1.0.0';
  public description: string = 'Screen recording plugin for Trici';
  private recorder: TriciRecorder;

  constructor(recorder: TriciRecorder) {
    this.recorder = recorder;

    // Listen for recording process crash events
    this.recorder.on('recordingProcessCrashed', ({ code, signal }) => {
      // End the focus session with a special trigger
      dispatch({
        type: 'END_FOCUS_SESSION',
        endTrigger: SessionTrigger.RECORDING_CRASH,
      });

      // Show notification to user
      dispatch({
        type: 'SHOW_ALERT_WINDOW',
        args: {
          alertType: 'ALERT_ERROR_MESSAGE',
          quitAppOnClose: false,
          message: `Recording process crashed unexpectedly (code: ${code}, signal: ${signal}). The focus session has been ended.`,
        },
      });
    });
  }

  public handleEvent(event: TriciAppEvent, ...data: any[]): void {
    const [focusSession] = data;
    switch (event) {
      case TriciAppEvent.FOCUS_SESSION_STARTED:
        this.handleFocusSessionStarted(focusSession as FocusSession);
        break;
      case TriciAppEvent.FOCUS_SESSION_ENDED:
        this.handleFocusSessionEnded(focusSession as FocusSession);
        break;
      default:
        break;
    }
  }

  private handleFocusSessionStarted(focusSession: FocusSession): void {
    const recordingFileName = focusSession.get('startTime').toString();
    const includeWatermark = true;
    const recordingStorageLocation = global.userDataDirectoryCheckResult.recordingsDir.path;
    const focusSessionRecordingsDir = path.join(recordingStorageLocation, recordingFileName);

    if (!fs.existsSync(focusSessionRecordingsDir)) {
      fs.mkdirSync(focusSessionRecordingsDir, { recursive: true });
      console.log(`Directory created at: ${focusSessionRecordingsDir}`);
    }

    const watermarkImagePath = isRunningInAsar
      ? path.join(app.getAppPath(), '..', 'app.asar.unpacked', 'resources', 'images', 'trici_watermark.png') + ''
      : app.getAppPath() + '/resources/images/trici_watermark.png';

    this.recorder.startLiveRecording(
      recordingFileName,
      focusSessionRecordingsDir,
      includeWatermark,
      watermarkImagePath,
    );

    this.recorder.on('recordingProcessExited', code => {
      logger.info('Recording process exited with code: ' + code);
    });

    this.recorder.on('finishedWritingSegment', () => {
      dispatch({
        type: 'FINISH_WRITING_SEGMENT',
      });
    });
  }

  private handleFocusSessionEnded(data: FocusSession): void {
    console.log('EndedFocusSession: ' + JSON.stringify(data));
    this.recorder.stopLiveRecording();
  }
}
