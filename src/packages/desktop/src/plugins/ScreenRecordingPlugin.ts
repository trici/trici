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

  public handleEvent(event: TRICI_APP_EVENT, data: any): void {
    switch (event) {
      case TRICI_APP_EVENT.FOCUS_SESSION_STARTED:
        this.handleFocusSessionStarted(data as FocusSession);
        break;
      case TRICI_APP_EVENT.FOCUS_SESSION_ENDED:
        this.handleFocusSessionEnded(data as FocusSession);
        break;
      default:
        break;
    }
  }

  private handleFocusSessionStarted(data: FocusSession): void {
    // //Start the recording. Writing this here for Hackathon. Ideally an event will be emitted from here and the recording process will listen to it.
    const recordingFileName = data.get('startTime').toString();
    const includeWatermark = true;
    const recordingStorageLocation = global.userDataDirectoryCheckResult.recordingsDir.path;
    const watermarkImagePath = isRunningInAsar
      ? path.join(app.getAppPath(), '..', 'app.asar.unpacked', 'resources', 'images', 'trici_watermark.png') + ''
      : app.getAppPath() + '/resources/images/trici_watermark.png';
    this.recorder.startLiveRecording(
      recordingFileName,
      recordingStorageLocation,
      3,
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
