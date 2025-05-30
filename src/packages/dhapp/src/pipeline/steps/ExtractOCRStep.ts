import { IDhappJob } from '@trici/dal';
import { IConsoleLogger, Logger } from '@trici/logger';
import { IPipelineStep, IPipelineStepResult } from '../IPipelineStep';
import { BasePipelineStep } from './BasePipelineStep';

export class ExtractOCRStep extends BasePipelineStep {
  constructor(getLogger: () => Logger | IConsoleLogger) {
    super(getLogger, 3, 5000); // 3 retries, 5 second delay
  }

  getStepName(): string {
    return 'extract_ocr';
  }

  async execute(job: IDhappJob): Promise<IPipelineStepResult> {
    this.getLogger().info('Extracting OCR from frames');
    return this.retryWithBackoff(
      async () => {
        // TODO: Implement actual OCR extraction
        // For now, just return some dummy data
        return {
          success: true,
          data: {
            ocr: 'Extracted OCR text',
          },
        };
      },
      job,
      'OCR extraction',
    );
  }
}
