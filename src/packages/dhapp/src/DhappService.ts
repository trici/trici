import { IDhappJob, IDhappJobRepository } from '@trici/dal';
import { IPipeline, Pipeline } from './Pipeline';
import { DhappJobType } from '@trici/models';
import { IConsoleLogger, Logger } from '@trici/logger';
import path from 'path';
import * as fs from 'fs';
// import { IPickupService, PickupService } from './PickupService';
export interface IDhappService {
  start: () => void;
  stop: () => void;
  queueJob: (job: IFocusSessionDataProcessingJob) => Promise<IDhappJob>;
}

export interface IFocusSessionDataProcessingJob {
  job_session_directory: string;
  job_name: string;
  job_type: DhappJobType;
}

export class DhappService implements IDhappService {
  private jobRepository: IDhappJobRepository;
  private pipeline: IPipeline;
  private getLogger: () => Logger | IConsoleLogger;
  // private pickupService: IPickupService;

  constructor(jobRepository: IDhappJobRepository, ffmpegPath: string, getLogger: () => Logger | IConsoleLogger) {
    this.jobRepository = jobRepository;
    this.getLogger = getLogger;
    this.pipeline = new Pipeline(jobRepository, ffmpegPath, getLogger);
  }

  public start(): void {
    this.getLogger().info('Starting dhapp service pipeline');
    // start the pipeline
    try {
      this.pipeline.start();
    } catch (err: any) {
      this.getLogger().error(`Error starting pipeline: ${err.toString()}`);
    }

    // start the pickup service
  }

  public stop(): void {
    console.log('Stopping dhapp service');
    // stop the pipeline
    // stop the pickup service
  }

  public queueJob(job: IFocusSessionDataProcessingJob): Promise<IDhappJob> {
    // Only queue the job if the data exists
    // I.e. the job_session_directory exists and if job_type is focus_session_chunk then job_name data files should exist

    // Check if the job_session_directory exists
    if (!fs.existsSync(job.job_session_directory)) {
      throw new Error(`Job session directory ${job.job_session_directory} does not exist`);
    }

    if (!job.job_type) {
      throw new Error('Job type is required');
    }

    if (job.job_type === DhappJobType.FOCUS_SESSION_CHUNK) {
      const job_name = job.job_name;
      if (!job_name) {
        throw new Error('Job name is required');
      } else if (!job_name.match(/^\d{13}_\d{4}$/)) {
        throw new Error('Job name does not match chunk name format');
      } else {
        const chunkNumber = job_name.split('_')[1];
        const sessionName = job_name.split('_')[0];

        // Check for the required data files
        const eventsJsonFile = path.join(job.job_session_directory, `${sessionName}-events-chunk-${chunkNumber}.json`);
        const chunkInfoJsonFile = path.join(job.job_session_directory, `${sessionName}-chunkinfo-${chunkNumber}.json`);
        const tsVideoFile = path.join(job.job_session_directory, `${sessionName}_${chunkNumber}.ts`);
        const datFile = path.join(job.job_session_directory, `${sessionName}-itp-chunk-${chunkNumber}.dat`);

        if (!fs.existsSync(eventsJsonFile)) {
          throw new Error(`Required JSON file ${eventsJsonFile} does not exist`);
        }
        if (!fs.existsSync(chunkInfoJsonFile)) {
          throw new Error(`Required JSON file ${chunkInfoJsonFile} does not exist`);
        }
        if (!fs.existsSync(tsVideoFile)) {
          throw new Error(`Required TS video file ${tsVideoFile} does not exist`);
        }
        if (!fs.existsSync(datFile)) {
          throw new Error(`Required DAT file ${datFile} does not exist`);
        }
      }
    }

    return this.pipeline.queueJob(job);
  }
}
