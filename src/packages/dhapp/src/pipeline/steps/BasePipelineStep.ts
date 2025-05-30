import { IDhappJob } from '@trici/dal';
import { IConsoleLogger, Logger } from '@trici/logger';
import { IPipelineStep, PipelineStepError, PipelineStepErrorType, IPipelineStepResult } from '../IPipelineStep';

export abstract class BasePipelineStep implements IPipelineStep {
  protected constructor(
    protected getLogger: () => Logger | IConsoleLogger,
    protected maxRetries: number = 3,
    protected retryDelay: number = 5000,
  ) {}

  abstract getStepName(): string;
  abstract execute(job: IDhappJob, stepResults: Record<string, any>): Promise<IPipelineStepResult>;

  getMaxRetries(): number {
    return this.maxRetries;
  }

  getRetryDelay(): number {
    return this.retryDelay;
  }

  protected createError(
    type: PipelineStepErrorType,
    message: string,
    originalError?: any,
    retryAfter?: number,
  ): PipelineStepError {
    return {
      type,
      message,
      originalError,
      retryAfter,
    };
  }

  protected createSuccessResult(data?: any): IPipelineStepResult {
    return {
      success: true,
      data,
    };
  }

  protected createErrorResult(error: PipelineStepError): IPipelineStepResult {
    return {
      success: false,
      error,
    };
  }

  protected async retryWithBackoff<T>(
    operation: () => Promise<T>,
    job: IDhappJob,
    context: string,
  ): Promise<IPipelineStepResult> {
    let lastError: any;
    const maxAttempts = this.getMaxRetries() + 1; // +1 for initial attempt

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const result = await operation();
        return this.createSuccessResult(result);
      } catch (error: any) {
        lastError = error;
        this.getLogger().warn(
          `Attempt ${attempt}/${maxAttempts} failed for ${context} in job ${job.id}: ${error.message}`,
        );

        if (attempt < maxAttempts) {
          const delay = this.getRetryDelay() * Math.pow(2, attempt - 1); // Exponential backoff
          this.getLogger().info(`Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    return this.createErrorResult(
      this.createError(
        PipelineStepErrorType.RETRYABLE,
        `Failed after ${maxAttempts} attempts: ${lastError.message}`,
        lastError,
      ),
    );
  }

  protected isRetryableError(error: any): boolean {
    // Add logic to determine if an error is retryable
    // For example, network errors, temporary file system issues, etc.
    return (
      error.code === 'ECONNRESET' ||
      error.code === 'ETIMEDOUT' ||
      error.code === 'ENOENT' ||
      error.message?.includes('temporary')
    );
  }

  protected isSkippableError(error: any): boolean {
    // Add logic to determine if an error can be skipped
    // For example, if a file is already processed, or if the step is optional
    return (
      error.message?.includes('already exists') ||
      error.message?.includes('not found') ||
      error.message?.includes('optional')
    );
  }
}
