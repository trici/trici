import { IPipeline } from './Pipeline';

export class PickupService {
  private pollIntervalId: NodeJS.Timeout | null = null;
  private directory: string;
  private pollInterval: number;
  private pipeline: IPipeline;

  constructor(directory: string, pollInterval: number, pipeline: IPipeline) {
    this.directory = directory;
    this.pollInterval = pollInterval;
    this.pipeline = pipeline;
  }

  start() {
    console.log(`Starting PickupService for directory: ${this.directory} with interval ${this.pollInterval}ms`);
    this.pollIntervalId = setInterval(() => {
      const job = this.scanDirectory();
      if (job) {
        console.log('Job found:', job);
        this.pipeline.queueJob(job);
      }
    }, this.pollInterval);
  }

  stop() {
    console.log('Stopping PickupService');
    if (this.pollIntervalId) {
      clearInterval(this.pollIntervalId);
      this.pollIntervalId = null;
    }
  }

  // This method simulates scanning the directory for a job.
  // In production, you'd implement actual file/directory scanning logic.
  protected scanDirectory(): null {
    return null;
  }
}
