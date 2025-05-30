import { IDhappJob } from '@trici/dal';
import { IConsoleLogger, Logger } from '@trici/logger';
import { IPipelineStep, IPipelineStepResult } from '../IPipelineStep';
import { BasePipelineStep } from './BasePipelineStep';
import * as fs from 'fs/promises';
import * as path from 'path';

interface PointOfInterest {
  timestamp: number;
  type: 'app_change' | 'activity';
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

  async execute(job: IDhappJob, stepResults: Record<string, any>): Promise<IPipelineStepResult> {
    this.getLogger().info('Extracting frames from video at points of interest');
    return this.retryWithBackoff(
      async () => {
        // Read points of interest from file
        const sessionName = job.job_name.split('_')[0];
        const chunkNumber = job.job_name.split('_')[1];
        const pointsPath = path.join(job.job_session_directory, `${sessionName}-poi-chunk-${chunkNumber}.json`);

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

        // TODO: Implement actual frame extraction using ffmpeg
        // For each point of interest, extract a frame from the video
        const frames: string[] = [];
        for (const point of pointsOfInterest) {
          // TODO: Use ffmpeg to extract frame at point.timestamp
          frames.push(`frame_${point.timestamp}.jpg`);
        }

        // Write frames to a file
        const framesPath = path.join(job.job_session_directory, `${sessionName}-frames-chunk-${chunkNumber}.json`);
        try {
          await fs.writeFile(framesPath, JSON.stringify(frames, null, 2));
        } catch (error) {
          this.getLogger().error(`Error writing frames to file: ${error}`);
          throw new Error(`Failed to write frames to file: ${error}`);
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
