import { IDhappJob } from '@trici/dal';
import { IConsoleLogger, Logger } from '@trici/logger';
import { IPipelineStep, IPipelineStepResult } from '../IPipelineStep';
import { BasePipelineStep } from './BasePipelineStep';
import * as fs from 'fs/promises';
import * as path from 'path';
import { DataWriter } from '@trici/datawriter';

interface IdleTimeProfile {
  timestamp: number;
  idleTime: number;
}

interface Event {
  timestamp: number;
  type: string;
  data?: any;
}

interface PointOfInterest {
  timestamp: number;
  type: 'app_change' | 'activity';
  metadata?: {
    appName?: string;
    idleTime?: number;
  };
}

export class ExtractPointsOfInterestStep extends BasePipelineStep {
  constructor(getLogger: () => Logger | IConsoleLogger) {
    super(getLogger, 3, 5000); // 3 retries, 5 second delay
  }

  getStepName(): string {
    return 'extract_points_of_interest';
  }

  private async loadIdleTimeProfile(job: IDhappJob): Promise<IdleTimeProfile[]> {
    const jobSessionDir = job.job_session_directory;
    const sessionName = job.job_name.split('_')[0];
    const chunkNumber = job.job_name.split('_')[1];

    const itpPath = path.join(jobSessionDir, `${sessionName}-itp-chunk-${chunkNumber}.dat`);
    const buf = await fs.readFile(itpPath);
    const itp = DataWriter.readIdleTimeProfileFromBuffer(buf);
    return itp;
  }

  private async loadEvents(job: IDhappJob): Promise<Event[]> {
    const jobSessionDir = job.job_session_directory;
    const sessionName = job.job_name.split('_')[0];
    const chunkNumber = job.job_name.split('_')[1];

    const eventsPath = path.join(jobSessionDir, `${sessionName}-events-chunk-${chunkNumber}.csv`);
    const data = await fs.readFile(eventsPath, 'utf-8');
    const events = data.split('\n').map(line => {
      const [timestamp, type, data] = line.split(',');
      return {
        timestamp: parseInt(timestamp),
        type,
        data,
      };
    });
    return events;
  }

  private extractPointsFromAppChanges(events: Event[]): PointOfInterest[] {
    const points: PointOfInterest[] = [];

    for (const event of events) {
      if (event.type === 'frontmost-app-changed') {
        // Add point 500ms before the event
        points.push({
          timestamp: event.timestamp - 500,
          type: 'app_change',
          metadata: {
            appName: event.data?.appName,
          },
        });

        // Add point 500ms after the event
        points.push({
          timestamp: event.timestamp + 500,
          type: 'app_change',
          metadata: {
            appName: event.data?.appName,
          },
        });
      }
    }

    return points;
  }

  private extractPointsFromActivity(itp: IdleTimeProfile[]): PointOfInterest[] {
    const points: PointOfInterest[] = [];
    const ACTIVE_THRESHOLD = 500; // ms
    const MIN_ACTIVITY_GAP = 1500; // ms

    let lastActivityPoint: number | null = null;

    for (const profile of itp) {
      if (profile.idleTime < ACTIVE_THRESHOLD) {
        // If this is the first activity point or enough time has passed since the last one
        if (lastActivityPoint === null || profile.timestamp - lastActivityPoint >= MIN_ACTIVITY_GAP) {
          points.push({
            timestamp: profile.timestamp,
            type: 'activity',
            metadata: {
              idleTime: profile.idleTime,
            },
          });
          lastActivityPoint = profile.timestamp;
        }
      }
    }

    return points;
  }

  async execute(job: IDhappJob): Promise<IPipelineStepResult> {
    this.getLogger().info('Extracting points of interest from idle time profile and events');

    return this.retryWithBackoff(
      async () => {
        // Load data
        const itp = await this.loadIdleTimeProfile(job);
        const events = await this.loadEvents(job);

        // Extract points from both sources
        const appChangePoints = this.extractPointsFromAppChanges(events);
        const activityPoints = this.extractPointsFromActivity(itp);

        // Combine and sort all points by timestamp
        const allPoints = [...appChangePoints, ...activityPoints].sort((a, b) => a.timestamp - b.timestamp);

        this.getLogger().info(`Extracted ${allPoints.length} points of interest`);

        return {
          points: allPoints,
        };
      },
      job,
      'points of interest extraction',
    );
  }
}
