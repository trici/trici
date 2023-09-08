import { FocusSession, TRICI_APP_EVENT } from '@trici/models';
import { ITriciPlugin } from '../typedefs/ITriciPlugin';
import { TriciRecorder } from '@trici/recorder';
import { app } from 'electron';
import path from 'path';
export class ScreenRecordingPlugin implements ITriciPlugin {
  public name: string = 'ScreenRecordingPlugin';
  public version: string = '1.0.0';
  public description: string = 'Screen recording plugin for Trici';
  private recorder: TriciRecorder;

  constructor(recorder: TriciRecorder) {
    this.recorder = recorder;
  }

  public handleEvent(event: TRICI_APP_EVENT, ...data: any[]): void {
    const [focusSession] = data;
    switch (event) {
      case TRICI_APP_EVENT.FOCUS_SESSION_STARTED:
        this.handleFocusSessionStarted(focusSession as FocusSession);
        break;
      case TRICI_APP_EVENT.FOCUS_SESSION_ENDED:
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
    const watermarkImagePath = isRunningInAsar
      ? path.join(app.getAppPath(), '..', 'app.asar.unpacked', 'resources', 'images', 'trici_watermark.png') + ''
      : app.getAppPath() + '/resources/images/trici_watermark.png';
    const screenToRecord = focusSession.get('screenToRecord');
    this.recorder.startLiveRecording(
      recordingFileName,
      recordingStorageLocation,
      screenToRecord,
      includeWatermark,
      watermarkImagePath,
    );
    this.recorder.on('recordingProcessExited', code => {
      logger.debug('Recording process exited with code: ' + code);
    });
  }

  private handleFocusSessionEnded(data: FocusSession): void {
    console.log('EndedFocusSession: ' + JSON.stringify(data));
    this.recorder.stopLiveRecording();
  }
}
