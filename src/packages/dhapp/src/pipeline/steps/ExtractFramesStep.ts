import { IDhappJob } from '@trici/dal';
import { IConsoleLogger, Logger } from '@trici/logger';
import { IPipelineStep, IPipelineStepResult } from '../IPipelineStep';
import { BasePipelineStep } from './BasePipelineStep';
import * as fs from 'fs/promises';
import * as path from 'path';
import { spawn } from 'child_process';

interface PointOfInterest {
  timestamp: number;
  type: 'before_app_change' | 'after_app_change' | 'activity';
  metadata?: {
    appName?: string;
    idleTime?: number;
  };
}

interface Frame {
  timestamp: number;
  type: 'before_app_change' | 'after_app_change' | 'activity';
  framePath: string;
  metadata?: {
    appName?: string;
    idleTime?: number;
  };
}

export class ExtractFramesStep extends BasePipelineStep {
  constructor(
    private ffmpegPath: string,
    getLogger: () => Logger | IConsoleLogger,
  ) {
    super(getLogger, 3, 5000); // 3 retries, 5 second delay
  }

  getStepName(): string {
    return 'extract_frames';
  }

  private async extractFrameFromTs(tsPath: string, timestamp: number, outputPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // Calculate the time offset within the ts segment
      const fileTimestamp = parseInt(path.basename(tsPath).split('_')[0]);
      const offsetMs = timestamp - fileTimestamp;
      const offsetSeconds = offsetMs / 1000;

      const args = [
        '-hide_banner',
        '-y',
        '-i',
        tsPath,
        '-ss',
        offsetSeconds.toString(),
        '-vframes',
        '1',
        '-q:v',
        '2', // High quality
        outputPath,
      ];

      this.getLogger().info(`Extracting frame from ${tsPath} at ${offsetSeconds} seconds`);
      this.getLogger().info(`ffmpeg args: ${args.join(' ')}`);

      const ffmpeg = spawn(this.ffmpegPath, args);

      ffmpeg.stderr.on('data', data => {
        this.getLogger().debug(`ffmpeg stderr: ${data}`);
      });

      ffmpeg.on('close', code => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`ffmpeg process exited with code ${code}`));
        }
      });

      ffmpeg.on('error', err => {
        reject(err);
      });
    });
  }

  async execute(job: IDhappJob, stepResults: Record<string, any>): Promise<IPipelineStepResult> {
    this.getLogger().info('Extracting frames from video at points of interest');
    return this.retryWithBackoff(
      async () => {
        // Read points of interest from file
        const sessionName = job.job_name.split('_')[0];
        const chunkNumber = job.job_name.split('_')[1];
        const pointsPath = path.join(
          job.job_session_directory,
          'processed',
          `${sessionName}-poi-chunk-${chunkNumber}.json`,
        );

        let pointsOfInterest: PointOfInterest[];
        try {
          const pointsData = await fs.readFile(pointsPath, 'utf-8');
          pointsOfInterest = JSON.parse(pointsData);
        } catch (error) {
          this.getLogger().error(`Error reading points of interest from file: ${error}`);
          throw new Error(`Failed to read points of interest from file: ${error}`);
        }

        if (!pointsOfInterest || pointsOfInterest.length === 0) {
          throw new Error('No points of interest found in file');
        }

        this.getLogger().info(`Extracting frames for ${pointsOfInterest.length} points of interest`);

        // Get the ts segment path
        const tsPath = path.join(job.job_session_directory, `${sessionName}_${chunkNumber}.ts`);
        try {
          await fs.access(tsPath);
        } catch (error) {
          throw new Error(`TS segment not found at ${tsPath}`);
        }

        // Create processed directory if it doesn't exist
        const processedDir = path.join(job.job_session_directory, 'processed');
        await fs.mkdir(processedDir, { recursive: true });

        // Create frames directory inside processed directory
        const framesDir = path.join(processedDir, 'frames');
        await fs.mkdir(framesDir, { recursive: true });

        const frames: Frame[] = [];
        for (const point of pointsOfInterest) {
          // Generate output path for the frame using the actual timestamp
          const framePath = path.join(framesDir, `${sessionName}_${point.timestamp}_${point.type}.jpg`);

          try {
            await this.extractFrameFromTs(tsPath, point.timestamp, framePath);
            frames.push({
              timestamp: point.timestamp,
              type: point.type,
              framePath,
              metadata: point.metadata,
            });
          } catch (error) {
            this.getLogger().error(`Error extracting frame at timestamp ${point.timestamp}: ${error}`);
            return {
              success: false,
              error: `Failed to extract frame at timestamp ${point.timestamp}: ${error}`,
            };
          }
        }

        // Write frames metadata to a file in the processed directory
        const framesPath = path.join(processedDir, `${sessionName}-frames-chunk-${chunkNumber}.json`);
        try {
          await fs.writeFile(framesPath, JSON.stringify(frames, null, 2));
        } catch (error) {
          this.getLogger().error(`Error writing frames metadata to file: ${error}`);
          throw new Error(`Failed to write frames metadata to file: ${error}`);
        }

        return {
          success: true,
          data: {
            frames,
          },
        };
      },
      job,
      'frame extraction',
    );
  }
}
