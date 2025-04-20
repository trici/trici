import type { Logger, IConsoleLogger } from '@trici/logger';
import { spawn, exec } from 'child_process';
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
  getLogger: () => Logger | IConsoleLogger;
  ffmpegProcess: any;
  #isRecording: boolean = false;
  #stopRecordingRequested: boolean = false;

  constructor(ffmpgBinPath: string, getLogger: () => Logger | IConsoleLogger, recorderBinPath: string) {
    super();
    this.#ffmpegBinPath = ffmpgBinPath;
    this.#recorderBinPath = recorderBinPath;
    this.getLogger = getLogger;
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

  async getScreenResolution(): Promise<any> {
    if (!this.recordingProcess) {
      throw new Error('Recording process not initialized');
    }
    return new Promise((resolve, reject) => {
      const responseHandler = (data: Buffer) => {
        // console.log('Inside responseHandler');
        try {
          const resolutionResponse = JSON.parse(data.toString('utf8'));
          this.getLogger().info('resolutionResponse:', resolutionResponse);
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
            this.getLogger().error(`Invalid response type in response: ${JSON.stringify(resolutionResponse)}`);
            reject(new Error('Invalid response type'));
          }
        } catch (error) {
          this.getLogger().error(`Error parsing response: ${error}`);
          reject(error);
        }
      };
      this.recordingProcess.stdout.once('data', responseHandler);
      this.recordingProcess.stdin.write('getResolution\n', (err: any) => {
        if (err) this.getLogger().warn(`Error writing getResolution command: ${err}`);
        this.getLogger().info('getResolution command written');
      });
    });
  }

  async startLiveRecording(
    recordingFileName: string,
    recordingStorageLocation: string,
    includeWatermark: boolean,
    waterMarkImagePath: string,
  ): Promise<void> {
    let recordingProcessStarted = false;
    this.#stopRecordingRequested = false;
    try {
      if (!this.recordingProcess) {
        const appEnv = process.env.APP_ENV || 'dev';
        this.recordingProcess = spawn(this.#recorderBinPath, [], { env: { ...process.env, APP_ENV: appEnv } });
        this.recordingProcess.on('error', (error: any) => {
          this.getLogger().error(`TriciRecorder process error: ${error}`);
        });

        this.recordingProcess.stderr.on('data', (data: any) => {
          const rawData = data.toString('utf8');
          try {
            // Try parsing as JSON first
            const logData = JSON.parse(rawData);
            if (logData.type === 'stdErr') {
              this.getLogger().error(`TriciRecorder process stderr: ${JSON.stringify(logData.response)}`);
            } else {
              this.getLogger().info(`${logData.type}: ${JSON.stringify(logData.response)}`);
            }
          } catch (parseError) {
            // If JSON parsing fails, log the raw data as potential error output
            this.getLogger().error(`TriciRecorder process raw stderr: ${rawData}`);
          }
        });

        this.recordingProcess.stdout.on('data', (data: any) => {
          this.getLogger().info(`TriciRecorder process stdout: ${data}`);
          const response = JSON.parse(data.toString('utf8')).response;
          if (response.message === 'screenRecorderStopped') {
            this.#isRecording = false;
            this.recordingProcess.kill('SIGTERM');
          } else if (
            response.message === 'screenRecorderStoppedByOS' ||
            response.message === 'screenRecorderStoppedByError'
          ) {
            this.getLogger().error(`Screen recorder stopped by ${response.message}`);
            this.#isRecording = false;
            this.recordingProcess.kill('SIGTERM');
          }
          if (response.message === 'screenRecorderStarted') {
            this.getLogger().info('Screen recorder started');
          }
        });

        // Add an exit handler to log when the process terminates
        this.recordingProcess.on('exit', (code: number | null, signal: string | null) => {
          if (!this.#stopRecordingRequested) {
            this.getLogger().error(`TriciRecorder process exited unexpectedly with code: ${code}, signal: ${signal}`);
            this.emit('recordingProcessCrashed', { code, signal });
          } else {
            this.getLogger().warn(`TriciRecorder process exited with code: ${code}, signal: ${signal}`);
            if (this.#isRecording) {
              this.getLogger().warn(`Recording process exited unexpectedly with code: ${code}, signal: ${signal}`);
              this.emit('recordingProcessExitedUnexpectedly', { code, signal });
              this.stopLiveRecording().catch(err =>
                this.getLogger().error(`Error stopping recording after unexpected exit: ${err}`),
              );
            }
          }
        });

        console.log('Recording process pid:', this.recordingProcess.pid);
        recordingProcessStarted = true;
      }
    } catch (error) {
      this.getLogger().error(`TriciRecorder failed to start:${error}`);
      throw error;
    }

    const recordingFileNameWithPath = `${recordingStorageLocation}/${recordingFileName}`;
    // const recordingCommandStdOutStdErrFileNameWithPath = `${recordingStorageLocation}/${recordingFileName}-rec.log`;
    // const recordingCommandStdOutStdErrFileStream = fs.createWriteStream(recordingCommandStdOutStdErrFileNameWithPath, {
    //   flags: 'a',
    // });

    try {
      this.getLogger().info(`TriciRecorder startLiveRecording: ${recordingFileName}`);

      this.recordingProcess.stdin.write(`start ${recordingFileNameWithPath}.mp4 120\n`);

      this.#isRecording = true;
      // resolve();
    } catch (error) {
      this.getLogger().error(`TriciRecorder error: ${error}`);
      // reject(error);
      throw error;
    }
  }

  async stopLiveRecording(): Promise<void> {
    const sessionEndTimestamp = Date.now();
    if (this.#isRecording) {
      this.#stopRecordingRequested = true;
      return new Promise((resolve, reject) => {
        console.log('Stopping live recording');
        if (this.recordingProcess && this.recordingProcess.stdin.writable) {
          console.log('Writing stop command to recordingProcess.stdin');
          this.recordingProcess.stdin.write(`stop ${sessionEndTimestamp}\n`, (err: any) => {
            if (err) this.getLogger().warn(`Error writing stop command: ${err}`);
          });
        }
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
        this.getLogger().error(`TriciRecorder process error: ${error}`);
        throw error;
      });

      this.recordingProcess.stderr.on('data', (data: any) => {
        this.getLogger().error(`Screenshot process error: ${data}`);
      });
    }

    return new Promise((resolve, reject) => {
      const responseHandler = (data: Buffer) => {
        const response = data.toString().trim();
        this.getLogger().info(`Screenshot response: ${response}`);

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
