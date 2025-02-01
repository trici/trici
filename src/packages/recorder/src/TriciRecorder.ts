import type { Logger } from '@trici/logger';
import { IConsoleLogger } from '@trici/logger';
import { spawn, exec } from 'child_process';
import fs from 'fs';
import EventEmitter from 'events';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface ITriciRecorder {
  startLiveRecording(
    recordingFileName: string,
    recordingStorageLocation: string,
    // screenToRecord: number,
    includeWatermark: boolean,
    waterMarkImagePath: string,
  ): void;
  stopLiveRecording(): void;
  isRecording(): boolean;
  takeScreenshot(screenShotFileName: string, screenShotStorageLocation: string): Promise<void>;
}

/**
 *
 */
export class TriciRecorder extends EventEmitter implements ITriciRecorder {
  #ffmpegBinPath: string;
  #recorderBinPath: string;
  recordingProcess: any;
  logger: Logger | IConsoleLogger;
  ffmpegProcess: any;
  #isRecording: boolean = false;

  private readonly namedPipePath: string = '/tmp/tricistream';

  constructor(ffmpgBinPath: string, logger: Logger | IConsoleLogger, recorderBinPath: string) {
    super();
    this.#ffmpegBinPath = ffmpgBinPath;
    this.#recorderBinPath = recorderBinPath;
    this.logger = logger;
    this.recordingProcess = null;
    this.ffmpegProcess = null;
  }

  // private (screenToRecord: number): number {
  //   const command = `${
  //     this.#ffmpegBinPath
  //   } -hide_banner -f avfoundation -list_devices true -i "" 2>&1 | grep "screen ${screenToRecord}" | awk -F "]" '{print $2}' | grep -o -E '[0-9]+'`;
  //   const output = child_process.execSync(command).toString().trim();
  //   return parseInt(output);
  // }

  private async createNamedPipe(): Promise<void> {
    try {
      // Check if the pipe already exists
      await fs.promises.access(this.namedPipePath, fs.constants.F_OK);
      this.logger.info(`Named pipe already exists at ${this.namedPipePath}`);
    } catch (error) {
      // If the pipe doesn't exist, create it
      try {
        await execAsync(`mkfifo ${this.namedPipePath}`);
        this.logger.info(`Named pipe created at ${this.namedPipePath}`);
      } catch (mkfifoError: any) {
        this.logger.error(`Error creating named pipe: ${mkfifoError.message}`);
        throw mkfifoError;
      }
    }
  }

  async getScreenResolution(): Promise<any> {
    if (!this.recordingProcess) {
      throw new Error('Recording process not initialized');
    }
    return new Promise((resolve, reject) => {
      const responseHandler = (data: Buffer) => {
        // console.log('Inside responseHandler');
        try {
          const resolutionResponse = JSON.parse(data.toString('utf8'));
          this.logger.info('resolutionResponse:', resolutionResponse);
          if (resolutionResponse.type === 'stdOut') {
            const resolutionValue = resolutionResponse.response;
            const resolutionString = resolutionValue.resolution.replace(/[()]/g, ''); //1440.0, 900.0
            const [width, height] = resolutionString.split(',').map(Number);
            const resolution = {
              width: Math.round(width),
              height: Math.round(height),
            };
            resolve(resolution);
          } else {
            this.logger.error(`Invalid response type in response: ${JSON.stringify(resolutionResponse)}`);
            reject(new Error('Invalid response type'));
          }
        } catch (error) {
          this.logger.error(`Error parsing response: ${error}`);
          reject(error);
        }
      };
      this.recordingProcess.stdout.once('data', responseHandler);
      this.recordingProcess.stdin.write('getResolution\n', (err: any) => {
        if (err) this.logger.warn(`Error writing getResolution command: ${err}`);
        this.logger.info('getResolution command written');
      });
    });
  }

  async startLiveRecording(
    recordingFileName: string,
    recordingStorageLocation: string,
    includeWatermark: boolean,
    waterMarkImagePath: string,
  ): Promise<void> {
    // Named pipe should be created before starting the recording process
    await this.createNamedPipe();

    let screenResolution = null;

    let recordingProcessStarted = false;

    try {
      if (!this.recordingProcess) {
        this.recordingProcess = spawn(this.#recorderBinPath);
        this.recordingProcess.on('error', (error: any) => {
          console.log('TriciRecorder process error:', error);
          this.logger.error(`TriciRecorder process error: ${error}`);
        });

        this.recordingProcess.stderr.on('data', (data: any) => {
          const logData = JSON.parse(data.toString('utf8'));
          if (logData.type === 'stdErr') {
            this.logger.error(`TriciRecorder process stderr: ${JSON.stringify(logData.response)}`);
          } else {
            this.logger.info(`${logData.type}: ${JSON.stringify(logData.response)}`);
          }
        });

        console.log('Recording process pid:', this.recordingProcess.pid);
        screenResolution = await this.getScreenResolution();
        recordingProcessStarted = true;
      }
    } catch (error) {
      this.logger.error(`TriciRecorder failed to start:${error}`);
      throw error;
    }

    const recordingFileNameWithPath = `${recordingStorageLocation}/${recordingFileName}`;
    const recordingCommandStdOutStdErrFileNameWithPath = `${recordingStorageLocation}/${recordingFileName}.log`;
    const recordingCommandStdOutStdErrFileStream = fs.createWriteStream(recordingCommandStdOutStdErrFileNameWithPath, {
      flags: 'a',
    });
    const sizeParam = `${screenResolution.width}x${screenResolution.height}`;
    // const sizeParam = `1920x1080`;
    console.log('this.#ffmpegBinPath:', this.#ffmpegBinPath);
    const waterMarkImagePathParam = `${waterMarkImagePath}`;
    const args = [
      '-hide_banner',
      '-loglevel',
      'debug',
      '-pixel_format',
      'nv12',
      '-video_size',
      sizeParam,
      '-f',
      'rawvideo',
      '-framerate',
      '7',
      '-fflags',
      '+genpts',
      '-use_wallclock_as_timestamps',
      '1',
      '-i',
      this.namedPipePath,
      '-i',
      waterMarkImagePathParam,
      '-filter_complex',
      `scale=-2:1080,setsar=1,overlay=W-w-5:H-h-5`,
      '-c:v',
      'h264_videotoolbox',
      '-b:v',
      '1526K',
      '-profile:v',
      'high',
      '-fps_mode',
      'vfr',
      '-f',
      'segment',
      '-segment_time',
      '7',
      '-segment_list_flags',
      'live',
      '-segment_list_size',
      '0',
      '-max_muxing_queue_size',
      '1024',
      '-reset_timestamps',
      '1',
      '-force_key_frames',
      'expr:gte(t,n_forced*5)',
      `${recordingFileNameWithPath}-%04d.mp4`,

      // `${recordingFileNameWithPath}.mp4`,
    ];

    this.logger.info(`ffmpegProcess args: ${JSON.stringify(args)}`);
    console.log('args:', args);

    try {
      this.ffmpegProcess = spawn(this.#ffmpegBinPath, args, {
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      this.logger.info(`TriciRecorder startLiveRecording: ${recordingFileName}`);

      this.recordingProcess.stdin.write('start\n');

      this.ffmpegProcess.stdout.pipe(recordingCommandStdOutStdErrFileStream);
      this.ffmpegProcess.stderr.pipe(recordingCommandStdOutStdErrFileStream);
      this.ffmpegProcess.stdin.on('error', (error: any) => {
        if (error.code === 'EPIPE') {
          this.logger.warn('FFmpeg input stream closed unexpectedly');
          this.stopLiveRecording().catch(err => this.logger.error(`Error stopping recording: ${err}`));
        } else {
          this.logger.error(`FFmpeg input stream error: ${error}`);
        }
      });
      this.ffmpegProcess.on('exit', (code: number) => {
        this.logger.info(`TriciEncoder exit: ${code}`);
        this.emit('recordingProcessExited', code);
      });
      this.ffmpegProcess.on('error', (error: any) => {
        this.logger.error(`TriciRecordingEncoder process error: ${error}`);
      });
      console.log('Encoding process pid:', this.ffmpegProcess.pid);

      // this.recordingProcess.stdout.pipe(this.ffmpegProcess.stdin).on('error', (error: any) => {
      //   this.logger.error(`Error piping recordingProcess.stdout to ffmpegProcess.stdin: ${error}`);
      //   reject(error);
      // });
      this.#isRecording = true;
      // resolve();
    } catch (error) {
      this.logger.error(`TriciRecorder error: ${error}`);
      // reject(error);
      throw error;
    }
  }

  async stopLiveRecording(): Promise<void> {
    if (this.#isRecording) {
      return new Promise((resolve, reject) => {
        console.log('Stopping live recording');

        const cleanup = () => {
          console.log('Inside cleanup');
          if (this.recordingProcess) {
            this.recordingProcess.stdin.write('stop\n');
            this.recordingProcess.stdin.end();
            this.recordingProcess.kill();
            this.recordingProcess = null;
          }
          if (this.ffmpegProcess) {
            console.log('killing ffmpegProcess');
            this.ffmpegProcess.stdin.end();
            this.ffmpegProcess.kill();
            this.ffmpegProcess = null;
          }
        };

        if (this.recordingProcess && this.recordingProcess.stdin.writable) {
          console.log('Writing stop command to recordingProcess.stdin');
          this.recordingProcess.stdin.write('stop\n', (err: any) => {
            if (err) this.logger.warn(`Error writing stop command: ${err}`);
          });
        }

        if (this.ffmpegProcess) {
          this.ffmpegProcess.once('close', (code: number) => {
            this.logger.info(`FFmpeg process closed with code: ${code}`);
            cleanup();
            this.#isRecording = false;
            resolve();
          });

          // Attempt to end FFmpeg input stream
          if (this.ffmpegProcess.stdin.writable) {
            this.ffmpegProcess.stdin.end();
          }
        } else {
          cleanup();
          resolve();
        }

        // Set a timeout in case FFmpeg doesn't close properly
        setTimeout(() => {
          this.logger.warn('FFmpeg process did not close in time, forcing cleanup');
          cleanup();
          resolve();
        }, 5000);
      });
    }
  }

  isRecording(): boolean {
    return this.#isRecording;
  }

  async takeScreenshot(screenShotFileName: string, screenShotStorageLocation: string): Promise<void> {
    const screenshotPath = `${screenShotStorageLocation}/${screenShotFileName}`;

    if (!this.recordingProcess) {
      this.recordingProcess = spawn(this.#recorderBinPath);
      this.recordingProcess.on('error', (error: any) => {
        this.logger.error(`TriciRecorder process error: ${error}`);
        throw error;
      });

      this.recordingProcess.stderr.on('data', (data: any) => {
        this.logger.error(`Screenshot process error: ${data}`);
      });
    }

    return new Promise((resolve, reject) => {
      const responseHandler = (data: Buffer) => {
        const response = data.toString().trim();
        this.logger.info(`Screenshot response: ${response}`);

        if (response.includes('Screenshot saved')) {
          this.recordingProcess.stdout.removeListener('data', responseHandler);
          resolve();
        } else if (response.includes('error')) {
          this.recordingProcess.stdout.removeListener('data', responseHandler);
          reject(new Error(response));
        }
      };

      this.recordingProcess.stdout.on('data', responseHandler);
      this.recordingProcess.stdin.write(`screenshot ${screenshotPath}\n`);
    });
  }

  // async stopLiveRecording(): Promise<void> {
  //   return new Promise((resolve, reject) => {
  //     console.log('Stopping live recording');
  //     this.recordingProcess.stdin.write('stop\n');
  //     this.ffmpegProcess.stdin.end();

  //     this.ffmpegProcess.on('close', (code: number) => {
  //       this.logger.info(`TriciRecorder ffmpegProcess exit: ${code}`);
  //       resolve();
  //     });
  //   });
  // }
}
