import type { Logger } from '@trici/logger';
import { IConsoleLogger } from '@trici/logger';
const child_process = require('child_process');
import fs from 'fs';
import EventEmitter from 'events';

export interface ITriciRecorder {
  startLiveRecording(
    recordingFileName: string,
    recordingStorageLocation: string,
    screenToRecord: number,
    includeWatermark: boolean,
    waterMarkImagePath: string,
  ): void;
  stopLiveRecording(): void;
}

/**
 *
 */
export class TriciRecorder extends EventEmitter implements ITriciRecorder {
  #ffmpegBinPath: string;
  recordingProcess: any;
  logger: Logger | IConsoleLogger;

  constructor(ffmpgBinPath: string, logger: Logger | IConsoleLogger) {
    super();
    this.#ffmpegBinPath = ffmpgBinPath;
    this.logger = logger;
    this.recordingProcess = null;
  }

  private fetchDeviceIndex(screenToRecord: number): number {
    const command = `${
      this.#ffmpegBinPath
    } -hide_banner -f avfoundation -list_devices true -i "" 2>&1 | grep "screen ${screenToRecord}" | awk -F "]" '{print $2}' | grep -o -E '[0-9]+'`;
    const output = child_process.execSync(command).toString().trim();
    return parseInt(output);
  }

  startLiveRecording(
    recordingFileName: string,
    recordingStorageLocation: string,
    screenToRecord: number,
    includeWatermark: boolean,
    waterMarkImagePath: string,
  ): void {
    const self = this;
    const recordingFileNameWithPath = `${recordingStorageLocation}/${recordingFileName}`;
    const recordingCommandStdOutStdErrFileNameWithPath = `${recordingStorageLocation}/${recordingFileName}.log`;
    const recordingCommandStdOutStdErrFileStream = fs.createWriteStream(recordingCommandStdOutStdErrFileNameWithPath, {
      flags: 'a',
    });
    const screenDeviceIndex = this.fetchDeviceIndex(screenToRecord);
    console.log('screenDeviceIndex:', screenDeviceIndex);
    console.log('this.#ffmpegBinPath:', this.#ffmpegBinPath);
    const screenToRecordParam = `${screenDeviceIndex}:none`;
    const waterMarkImagePathParam = `${waterMarkImagePath}`;
    const args = [
      '-hide_banner',
      '-pixel_format',
      'nv12',
      '-r',
      '7',
      '-f',
      'avfoundation',
      '-i',
      screenToRecordParam,
      '-i',
      waterMarkImagePathParam,
      '-filter_complex',
      'scale=-2:2160,setsar=1,overlay=W-w-5:H-h-5',
      '-c:v',
      'h264_videotoolbox',
      '-b:v',
      '1526K',
      '-profile:v',
      'high',
      '-f',
      'segment',
      '-segment_time',
      '5',
      '-segment_list_flags',
      'live',
      '-segment_list_size',
      '0',
      '-max_muxing_queue_size',
      '1024',
      '-reset_timestamps',
      '1',
      `${recordingFileNameWithPath}-%04d.mp4`,
    ];

    this.logger.info(`recordingProcess args: ${JSON.stringify(args)}`);
    console.log('args:', args);

    try {
      this.recordingProcess = child_process.spawn(this.#ffmpegBinPath, args, {
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      this.logger.info(`TriciRecorder startLiveRecording: ${recordingFileName}`);

      this.recordingProcess.stdout.pipe(recordingCommandStdOutStdErrFileStream);
      this.recordingProcess.stderr.pipe(recordingCommandStdOutStdErrFileStream);
      this.recordingProcess.on('exit', (code: number) => {
        this.logger.info(`TriciRecorder exit: ${code}`);
        self.emit('recordingProcessExited', code);
      });
      this.recordingProcess.on('error', (error: any) => {
        this.logger.error(`TriciRecorder  recording process error: ${error}`);
      });
      console.log('Recording process pid:', this.recordingProcess.pid);
    } catch (error) {
      this.logger.error(`TriciRecorder error: ${error}`);
    }
  }

  stopLiveRecording(): void {
    console.log('Stopping live recording');
    if (this.recordingProcess) {
      console.log('Killing recording process with pid:', this.recordingProcess.pid);
      this.logger.info(`TriciRecorder stopLiveRecording: ${this.recordingProcess.pid}`);
      this.recordingProcess.kill();
    }
  }
}
