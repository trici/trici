import { IDhappJob } from '@trici/dal';
import { IConsoleLogger, Logger } from '@trici/logger';
import { IPipelineStep, IPipelineStepResult } from '../IPipelineStep';
import { BasePipelineStep } from './BasePipelineStep';

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
        // Get points of interest from the extract_points_of_interest step
        const pointsOfInterest = stepResults['extract_points_of_interest'] as PointOfInterest[];
        if (!pointsOfInterest) {
          throw new Error('No points of interest found from extract_points_of_interest step');
        }

        this.getLogger().info(`Extracting frames for ${pointsOfInterest.length} points of interest`);

        // TODO: Implement actual frame extraction using ffmpeg
        // For each point of interest, extract a frame from the video
        const frames: string[] = [];
        for (const point of pointsOfInterest) {
          // TODO: Use ffmpeg to extract frame at point.timestamp
          frames.push(`frame_${point.timestamp}.jpg`);
        }

        return {
          frames,
        };
      },
      job,
      'frame extraction',
    );
  }
}
