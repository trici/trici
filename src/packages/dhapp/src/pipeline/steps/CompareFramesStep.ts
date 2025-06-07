import { IDhappJob } from '@trici/dal';
import { IConsoleLogger, Logger } from '@trici/logger';
import { IPipelineStep, IPipelineStepResult } from '../IPipelineStep';
import { BasePipelineStep } from './BasePipelineStep';
import * as fs from 'fs/promises';
import * as path from 'path';
import { compareImages } from '@trici/imageutils';

interface Frame {
  timestamp: number;
  type: 'before_app_change' | 'after_app_change' | 'activity';
  framePath: string;
  metadata?: {
    appName?: string;
    idleTime?: number;
  };
}

export class CompareFramesStep extends BasePipelineStep {
  constructor(getLogger: () => Logger | IConsoleLogger) {
    super(getLogger, 3, 5000); // 3 retries, 5 second delay
  }

  getStepName(): string {
    return 'compare_frames';
  }

  async execute(job: IDhappJob, stepResults: Record<string, any>): Promise<IPipelineStepResult> {
    this.getLogger().info('Comparing frames and rejecting similar ones');
    return this.retryWithBackoff(
      async () => {
        // Read frames from the JSON file created by ExtractFramesStep
        const sessionName = job.job_name.split('_')[0];
        const chunkNumber = job.job_name.split('_')[1];
        const framesPath = path.join(
          job.job_session_directory,
          'processed',
          `${sessionName}-frames-chunk-${chunkNumber}.json`,
        );

        let frames: Frame[];
        try {
          const framesData = await fs.readFile(framesPath, 'utf-8');
          frames = JSON.parse(framesData);
        } catch (error) {
          this.getLogger().error(`Error reading frames from file: ${error}`);
          throw new Error(`Failed to read frames from file: ${error}`);
        }

        if (!frames || frames.length === 0) {
          throw new Error('No frames found in file');
        }

        this.getLogger().info(`Comparing ${frames.length} frames`);

        // Always include the first frame
        const uniqueFrames: Frame[] = [frames[0]];

        // Compare consecutive frames
        for (let i = 1; i < frames.length; i++) {
          const currentFrame = frames[i];
          const previousFrame = frames[i - 1];

          try {
            const similarity = await compareImages(previousFrame.framePath, currentFrame.framePath);

            // If frames are significantly different (more than 5 bits different), include the current frame
            if (similarity > 5) {
              uniqueFrames.push(currentFrame);
              this.getLogger().debug(
                `Frame ${i} is significantly different from previous frame (${similarity} bits different)`,
              );
            } else {
              this.getLogger().debug(`Frame ${i} is similar to previous frame (${similarity} bits different)`);
            }
          } catch (error) {
            this.getLogger().error(`Error comparing frames: ${error}`);
            throw new Error(`Failed to compare frames: ${error}`);
          }
        }

        // Write unique frames to a new JSON file
        const uniqueFramesPath = path.join(
          job.job_session_directory,
          'processed',
          `${sessionName}-unique-frames-chunk-${chunkNumber}.json`,
        );

        try {
          await fs.writeFile(uniqueFramesPath, JSON.stringify(uniqueFrames, null, 2));
        } catch (error) {
          this.getLogger().error(`Error writing unique frames to file: ${error}`);
          throw new Error(`Failed to write unique frames to file: ${error}`);
        }

        return {
          success: true,
          data: {
            uniqueFrames,
            totalFrames: frames.length,
            uniqueFramesCount: uniqueFrames.length,
          },
        };
      },
      job,
      'frame comparison',
    );
  }
}
