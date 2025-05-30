import { IDhappJob } from '@trici/dal';

export enum PipelineStepErrorType {
  FATAL = 'fatal', // Error that cannot be recovered from
  RETRYABLE = 'retryable', // Error that can be retried
  SKIPPABLE = 'skippable', // Error that can be skipped and step marked as completed
}

export interface PipelineStepError {
  type: PipelineStepErrorType;
  message: string;
  originalError?: any;
  retryAfter?: number; // Time in milliseconds to wait before retry
}

export interface IPipelineStepResult {
  success: boolean;
  error?: PipelineStepError;
  data?: any; // Step-specific data that needs to be passed to subsequent steps
}

export interface IPipelineStep {
  execute(job: IDhappJob, stepResults: Record<string, any>): Promise<IPipelineStepResult>;
  getStepName(): string;
  getMaxRetries(): number; // Maximum number of retries for this step
  getRetryDelay(): number; // Delay in milliseconds between retries
}
