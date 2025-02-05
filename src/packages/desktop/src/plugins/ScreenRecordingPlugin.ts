import { FocusSession, TriciAppEvent } from '@trici/models';
import { ITriciPlugin } from '../typedefs/ITriciPlugin';
import { TriciRecorder } from '@trici/recorder';
import { app } from 'electron';
import path from 'path';
import fs from 'fs';

export class ScreenRecordingPlugin implements ITriciPlugin {
  public name: string = 'ScreenRecordingPlugin';
  public version: string = '1.0.0';
  public description: string = 'Screen recording plugin for Trici';
  private recorder: TriciRecorder;
  private currentRecordingDir: string | null = null;
  private currentRecordingFileName: string | null = null;

  constructor(recorder: TriciRecorder) {
    this.recorder = recorder;
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

    // Store the current recording info for playlist generation
    this.currentRecordingDir = focusSessionRecordingsDir;
    this.currentRecordingFileName = recordingFileName;

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
      logger.debug('Recording process exited with code: ' + code);
    });
  }

  private handleFocusSessionEnded(data: FocusSession): void {
    console.log('EndedFocusSession: ' + JSON.stringify(data));
    this.recorder.stopLiveRecording();
    logger.debug('Generating playlist');
    this.generatePlaylist();
  }

  private generatePlaylist(): void {
    if (!this.currentRecordingDir || !this.currentRecordingFileName) {
      console.error('No recording information available for playlist generation');
      return;
    }

    try {
      // Read the directory to get all MP4 segments
      const files = fs
        .readdirSync(this.currentRecordingDir)
        .filter(file => file.endsWith('.mp4'))
        .sort((a, b) => {
          // Extract segment numbers and compare
          const numA = parseInt(a.split('-')[1].replace('.mp4', ''));
          const numB = parseInt(b.split('-')[1].replace('.mp4', ''));
          return numA - numB;
        });

      if (files.length === 0) {
        logger.error('No MP4 segments found for playlist generation');
        return;
      }

      // Generate M3U8 content
      let m3u8Content = '#EXTM3U\n';
      m3u8Content += '#EXT-X-VERSION:3\n';
      m3u8Content += '#EXT-X-MEDIA-SEQUENCE:0\n';
      m3u8Content += '#EXT-X-TARGETDURATION:10\n\n';

      // Add each segment to the playlist
      files.forEach(file => {
        m3u8Content += '#EXTINF:10.0,\n';
        m3u8Content += `${file}\n`;
      });

      m3u8Content += '\n#EXT-X-ENDLIST\n';

      // Write the playlist file
      const playlistPath = path.join(this.currentRecordingDir, `${this.currentRecordingFileName}.m3u8`);
      fs.writeFileSync(playlistPath, m3u8Content);
      logger.debug(`Playlist generated at: ${playlistPath}`);
    } catch (error) {
      logger.error('Error generating playlist:', error);
    } finally {
      // Clear the current recording info
      this.currentRecordingDir = null;
      this.currentRecordingFileName = null;
    }
  }
}
