import { IDhappJob } from '@trici/dal';
import { IConsoleLogger, Logger } from '@trici/logger';
import { IPipelineStep, IPipelineStepResult } from '../IPipelineStep';
import { BasePipelineStep } from './BasePipelineStep';

export class CompareFramesStep extends BasePipelineStep {
  constructor(getLogger: () => Logger | IConsoleLogger) {
    super(getLogger, 3, 5000); // 3 retries, 5 second delay
  }

  getStepName(): string {
    return 'compare_frames';
  }

  async execute(job: IDhappJob): Promise<IPipelineStepResult> {
    this.getLogger().info('Comparing frames and rejecting similar ones');
    return this.retryWithBackoff(
      async () => {
        // TODO: Implement actual frame comparison
        // For now, just return some dummy data
        return {
          success: true,
          data: {
            similarFrames: ['frame1.jpg', 'frame2.jpg'],
          },
        };
      },
      job,
      'frame comparison',
    );
  }
}
