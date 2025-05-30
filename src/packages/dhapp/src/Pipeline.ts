import { IDhappJob, IDhappJobRepository } from '@trici/dal';
import { IConsoleLogger, Logger } from '@trici/logger';
import { IFocusSessionDataProcessingJob } from './DhappService';
import { DhappJobType } from '@trici/models';
import { IPipelineStep, PipelineStepErrorType, PipelineStepError } from './pipeline/IPipelineStep';
import { ExtractPointsOfInterestStep, ExtractFramesStep, CompareFramesStep, ExtractOCRStep } from './pipeline/steps';

export interface IPipeline {
  start: () => void;
  stop: () => void;
  queueJob: (job: IFocusSessionDataProcessingJob) => Promise<IDhappJob>;
}

export class Pipeline implements IPipeline {
  private jobPickerIntervalID: NodeJS.Timeout | null;
  private failedJobHandlerIntervalID: NodeJS.Timeout | null;
  private jobBeingHandled: IDhappJob | null;
  private jobRepository: IDhappJobRepository;
  private jobHandlingInProcess: boolean;
  private getLogger: () => Logger | IConsoleLogger;
  private ffmpegPath: string;
  private pipelineSteps: Map<DhappJobType, IPipelineStep[]>;
  private stepResults: Record<string, any>; // Store results for current job

  constructor(jobRepository: IDhappJobRepository, ffmpegPath: string, getLogger: () => Logger | IConsoleLogger) {
    this.jobBeingHandled = null;
    this.jobPickerIntervalID = null;
    this.failedJobHandlerIntervalID = null;
    this.jobRepository = jobRepository;
    this.jobHandlingInProcess = false;
    this.getLogger = getLogger;
    this.ffmpegPath = ffmpegPath;
    this.pipelineSteps = new Map();
    this.stepResults = {};
    this.initializePipelineSteps();
  }

  private initializePipelineSteps() {
    // Initialize steps for FOCUS_SESSION_CHUNK
    this.pipelineSteps.set(DhappJobType.FOCUS_SESSION_CHUNK, [
      new ExtractPointsOfInterestStep(() => this.getLogger()),
      new ExtractFramesStep(this.ffmpegPath, () => this.getLogger()),
      new CompareFramesStep(() => this.getLogger()),
      new ExtractOCRStep(() => this.getLogger()),
    ]);
  }

  start() {
    this.getLogger().info('Starting pipeline');
    // Start regular job processing
    this.jobPickerIntervalID = setInterval(() => this.handleJob(), 5000);
    // Start failed job handler with a longer interval
    this.failedJobHandlerIntervalID = setInterval(() => this.handleFailedJob(), 15000); // Every 15 seconds
  }

  stop() {
    this.getLogger().info('Stopping pipeline');
    if (this.jobPickerIntervalID) {
      clearInterval(this.jobPickerIntervalID);
      this.jobPickerIntervalID = null;
    }
    if (this.failedJobHandlerIntervalID) {
      clearInterval(this.failedJobHandlerIntervalID);
      this.failedJobHandlerIntervalID = null;
    }
  }

  async queueJob(job: IFocusSessionDataProcessingJob): Promise<IDhappJob> {
    this.getLogger().info('Queueing job:', job);
    const dhappJob: Omit<IDhappJob, 'created_at' | 'updated_at'> = {
      id: -1,
      job_session_directory: job.job_session_directory,
      job_name: job.job_name,
      job_type: job.job_type,
      status: 'pending',
      steps_completed: {},
      error_message: null,
      attempt_count: 0,
      failure_type: 'none',
    };
    return this.jobRepository.save(dhappJob);
  }

  private async handleJob() {
    this.getLogger().info('Handling job');
    if (this.jobHandlingInProcess) {
      this.getLogger().info(`Job ${this.jobBeingHandled?.id} handling In Process. Returning`);
      return;
    }

    const jobToHandle = await this.jobRepository.getJobToHandle();
    if (!jobToHandle) {
      this.jobHandlingInProcess = false;
      this.jobBeingHandled = null;
      this.stepResults = {}; // Reset step results
      this.getLogger().info('No pending job to handle. Returning');
      return;
    }

    this.jobBeingHandled = jobToHandle;
    this.jobHandlingInProcess = true;
    this.stepResults = {}; // Reset step results for new job

    try {
      // Update job status to processing
      jobToHandle.status = 'processing';
      await this.jobRepository.save(jobToHandle);

      const steps = this.pipelineSteps.get(jobToHandle.job_type as DhappJobType);
      if (!steps) {
        throw new Error(`No pipeline steps defined for job type: ${jobToHandle.job_type}`);
      }

      for (const step of steps) {
        const stepName = step.getStepName();
        // Check if step is already completed
        if (jobToHandle.steps_completed[stepName]) {
          this.getLogger().info(`Step ${stepName} already completed, skipping`);
          continue;
        }

        try {
          const result = await step.execute(jobToHandle, this.stepResults);

          if (result.success) {
            // Store step results in pipeline state
            this.stepResults[stepName] = result.data;

            // Mark step as completed
            jobToHandle.steps_completed[stepName] = true;
            await this.jobRepository.save(jobToHandle);
          } else {
            // Handle error from step execution
            const error = result.error;
            if (error?.type === PipelineStepErrorType.FATAL) {
              // Fatal errors cannot be recovered from
              jobToHandle.status = 'failed';
              jobToHandle.error_message = `Fatal error in step ${stepName}: ${error.message}`;
              jobToHandle.failure_type = 'fatal';
              await this.jobRepository.save(jobToHandle);
              throw error;
            } else if (error?.type === PipelineStepErrorType.RETRYABLE) {
              // For retryable errors, increment attempt count and update status
              jobToHandle.attempt_count = (jobToHandle.attempt_count || 0) + 1;

              if (jobToHandle.attempt_count >= step.getMaxRetries()) {
                jobToHandle.status = 'failed';
                jobToHandle.error_message = `Max retries exceeded for step ${stepName}: ${error.message}`;
                jobToHandle.failure_type = 'max_retries_exceeded';
              } else {
                jobToHandle.status = 'pending'; // Put back in queue for retry
                jobToHandle.error_message = `Retryable error in step ${stepName}: ${error.message}. Attempt ${jobToHandle.attempt_count}/${step.getMaxRetries()}`;
                jobToHandle.failure_type = 'retryable';
              }

              await this.jobRepository.save(jobToHandle);
              throw error;
            } else if (error?.type === PipelineStepErrorType.SKIPPABLE) {
              // For skippable errors, mark the step as completed and continue
              this.getLogger().warn(`Skipping step ${stepName} due to skippable error: ${error.message}`);
              jobToHandle.steps_completed[stepName] = true;
              jobToHandle.failure_type = 'skipped';
              await this.jobRepository.save(jobToHandle);
            } else {
              // Default error handling - treat as fatal
              jobToHandle.status = 'failed';
              jobToHandle.error_message = `Error in step ${stepName}: ${error?.message || 'Unknown error'}`;
              jobToHandle.failure_type = 'fatal';
              await this.jobRepository.save(jobToHandle);
              throw error;
            }
          }
        } catch (error: any) {
          this.getLogger().error(`Error executing step ${stepName}:`, error);
          throw error; // Re-throw to be handled by outer catch
        }
      }

      // All steps completed successfully
      jobToHandle.status = 'completed';
      await this.jobRepository.save(jobToHandle);
    } catch (error: any) {
      this.getLogger().error('Error handling job:', error);
      if (jobToHandle) {
        if (jobToHandle.status !== 'failed') {
          jobToHandle.status = 'failed';
          jobToHandle.error_message = error.message;
          await this.jobRepository.save(jobToHandle);
        }
      }
    } finally {
      this.jobHandlingInProcess = false;
      this.jobBeingHandled = null;
      this.stepResults = {}; // Reset step results
    }
  }

  private async handleFailedJob() {
    this.getLogger().info('Checking for a failed job to retry');

    // Get one failed job that is retryable and hasn't exceeded its max retries
    const failedJob = await this.jobRepository.getOneFailedJob();
    if (!failedJob) {
      this.getLogger().info('No failed jobs available for retry');
      return;
    }

    // Double check that this is a retryable job
    if (failedJob.failure_type !== 'retryable') {
      this.getLogger().warn(`Job ${failedJob.id} is not retryable (failure_type: ${failedJob.failure_type})`);
      return;
    }

    const steps = this.pipelineSteps.get(failedJob.job_type as DhappJobType);
    if (!steps) {
      this.getLogger().error(`No pipeline steps defined for job type: ${failedJob.job_type}`);
      return;
    }

    // Find the last failed step
    const lastFailedStep = steps.find(step => !failedJob.steps_completed[step.getStepName()]);
    if (!lastFailedStep) {
      this.getLogger().warn(`No failed step found for job ${failedJob.id}`);
      return;
    }

    // Check if we should retry based on exponential backoff
    const timeSinceLastAttempt = Date.now() - (new Date(failedJob.updated_at).getTime() || 0);
    const backoffDelay = this.calculateBackoffDelay(failedJob.attempt_count || 0);

    if (timeSinceLastAttempt < backoffDelay) {
      this.getLogger().info(
        `Job ${failedJob.id} not ready for retry yet. Time since last attempt: ${timeSinceLastAttempt}ms, Required delay: ${backoffDelay}ms`,
      );
      return;
    }

    try {
      // Reset job status for retry
      failedJob.status = 'pending';
      failedJob.error_message = `Retrying after ${failedJob.attempt_count} previous attempts`;
      await this.jobRepository.save(failedJob);

      this.getLogger().info(`Retrying job ${failedJob.id} from step ${lastFailedStep.getStepName()}`);

      // Get results from completed steps
      const stepResults: Record<string, any> = {};
      for (const step of steps) {
        const stepName = step.getStepName();
        if (failedJob.steps_completed[stepName] && stepName !== lastFailedStep.getStepName()) {
          stepResults[stepName] = this.stepResults[stepName];
        }
      }

      // Execute the failed step
      const result = await lastFailedStep.execute(failedJob, stepResults);
      if (result.success) {
        // Store step results
        this.stepResults[lastFailedStep.getStepName()] = result.data;

        // Mark step as completed
        failedJob.steps_completed[lastFailedStep.getStepName()] = true;
        await this.jobRepository.save(failedJob);

        // Continue with remaining steps
        const remainingSteps = steps.slice(steps.indexOf(lastFailedStep) + 1);
        for (const step of remainingSteps) {
          try {
            const stepResult = await step.execute(failedJob, this.stepResults);
            if (stepResult.success) {
              this.stepResults[step.getStepName()] = stepResult.data;
              failedJob.steps_completed[step.getStepName()] = true;
              await this.jobRepository.save(failedJob);
            } else {
              throw stepResult.error;
            }
          } catch (error: any) {
            const classifiedError = this.classifyError(error, lastFailedStep);
            throw classifiedError; // Let the main error handler deal with it
          }
        }

        // If we get here, all remaining steps completed successfully
        failedJob.status = 'completed';
        await this.jobRepository.save(failedJob);
      } else {
        throw result.error;
      }
    } catch (error: any) {
      const classifiedError = this.classifyError(error, lastFailedStep);

      if (classifiedError.type === PipelineStepErrorType.FATAL) {
        failedJob.status = 'failed';
        failedJob.error_message = `Fatal error in retry attempt: ${classifiedError.message}`;
        failedJob.failure_type = 'fatal';
      } else if (classifiedError.type === PipelineStepErrorType.RETRYABLE) {
        failedJob.attempt_count = (failedJob.attempt_count || 0) + 1;
        if (failedJob.attempt_count >= lastFailedStep.getMaxRetries()) {
          failedJob.status = 'failed';
          failedJob.error_message = `Max retries exceeded in retry attempt: ${classifiedError.message}`;
          failedJob.failure_type = 'max_retries_exceeded';
        } else {
          failedJob.status = 'failed'; // Will be picked up in next retry cycle
          failedJob.error_message = `Retryable error in retry attempt: ${classifiedError.message}. Attempt ${failedJob.attempt_count}/${lastFailedStep.getMaxRetries()}`;
          failedJob.failure_type = 'retryable';
        }
      } else {
        failedJob.status = 'failed';
        failedJob.error_message = `Error in retry attempt: ${classifiedError.message}`;
        failedJob.failure_type = 'fatal';
      }

      await this.jobRepository.save(failedJob);
    }
  }

  private calculateBackoffDelay(attemptCount: number): number {
    // Base delay of 5 seconds, doubles with each attempt
    const baseDelay = 5000;
    const maxDelay = 300000; // 5 minutes
    const delay = Math.min(baseDelay * Math.pow(2, attemptCount), maxDelay);
    return delay;
  }

  private classifyError(error: any, step: IPipelineStep): PipelineStepError {
    // If error is already a PipelineStepError, return it
    if (error.type && Object.values(PipelineStepErrorType).includes(error.type)) {
      return error;
    }

    // Check if it's a retryable error
    if (this.isRetryableError(error)) {
      return {
        type: PipelineStepErrorType.RETRYABLE,
        message: error.message || 'Unknown retryable error',
        originalError: error,
        retryAfter: step.getRetryDelay(),
      };
    }

    // Check if it's a skippable error
    if (this.isSkippableError(error)) {
      return {
        type: PipelineStepErrorType.SKIPPABLE,
        message: error.message || 'Unknown skippable error',
        originalError: error,
      };
    }

    // Default to fatal error
    return {
      type: PipelineStepErrorType.FATAL,
      message: error.message || 'Unknown fatal error',
      originalError: error,
    };
  }

  private isRetryableError(error: any): boolean {
    // Network errors
    if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
      return true;
    }

    // File system errors that might be temporary
    if (error.code === 'ENOENT' || error.code === 'EACCES') {
      return true;
    }

    // Check error message for retryable indicators
    const retryableIndicators = [
      'temporary',
      'timeout',
      'connection',
      'network',
      'retry',
      'busy',
      'resource temporarily unavailable',
    ];

    return retryableIndicators.some(indicator => error.message?.toLowerCase().includes(indicator));
  }

  private isSkippableError(error: any): boolean {
    // Check error message for skippable indicators
    const skippableIndicators = ['already exists', 'not found', 'optional', 'skipped', 'no data', 'empty'];

    return skippableIndicators.some(indicator => error.message?.toLowerCase().includes(indicator));
  }
}
