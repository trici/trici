import { IDhappJob } from '@trici/dal';
import { IConsoleLogger, Logger } from '@trici/logger';
import { IPipelineStepResult } from '../IPipelineStep';
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

interface FrontmostApp {
  appName: string;
  appIdentifier: string;
  timestamp: number;
}

interface TimeRange {
  start: number;
  end: number;
}

interface ChunkInfo {
  frontmostApp: FrontmostApp;
  timeRange: TimeRange;
}

interface PointOfInterest {
  timestamp: number;
  type: 'before_app_change' | 'after_app_change' | 'activity';
  metadata: {
    appName: string;
    appIdentifier: string;
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

    const eventsPath = path.join(jobSessionDir, `${sessionName}-events-chunk-${chunkNumber}.json`);
    const data = await fs.readFile(eventsPath, 'utf-8');

    try {
      const events = JSON.parse(data);
      return events.map((event: any) => ({
        timestamp: event.timestamp,
        type: event.type,
        data: event.data,
      }));
    } catch (error) {
      this.getLogger().error(`Failed to parse events file: ${error}`);
      this.getLogger().error(`Raw file contents: ${data}`);
      throw error;
    }
  }

  private async loadChunkInfo(job: IDhappJob): Promise<ChunkInfo> {
    const jobSessionDir = job.job_session_directory;
    const sessionName = job.job_name.split('_')[0];
    const chunkNumber = job.job_name.split('_')[1];

    const chunkInfoPath = path.join(jobSessionDir, `${sessionName}-chunkinfo-${chunkNumber}.json`);
    const data = await fs.readFile(chunkInfoPath, 'utf-8');
    return JSON.parse(data);
  }

  private extractPointsFromAppChanges(events: Event[], initialApp: FrontmostApp): PointOfInterest[] {
    const points: PointOfInterest[] = [];
    let currentApp = initialApp;

    for (const event of events) {
      if (event.type === 'frontmost-app-changed') {
        const eventData = event.data[0];

        // Add point 500ms before the event using the previous app
        points.push({
          timestamp: event.timestamp - 500,
          type: 'before_app_change',
          metadata: {
            appName: eventData.previousApp.appName,
            appIdentifier: eventData.previousApp.appIdentifier,
          },
        });

        // Add point 500ms after the event using the new frontmost app
        points.push({
          timestamp: event.timestamp + 500,
          type: 'after_app_change',
          metadata: {
            appName: eventData.frontmostApp.appName,
            appIdentifier: eventData.frontmostApp.appIdentifier,
          },
        });

        // Update current app for future reference
        currentApp = {
          appName: eventData.frontmostApp.appName,
          appIdentifier: eventData.frontmostApp.appIdentifier,
          timestamp: event.timestamp,
        };
      }
    }

    return points;
  }

  private extractPointsFromActivity(
    itp: IdleTimeProfile[],
    events: Event[],
    initialApp: FrontmostApp,
  ): PointOfInterest[] {
    const points: PointOfInterest[] = [];
    const ACTIVE_THRESHOLD = 500; // ms
    const MIN_ACTIVITY_GAP = 1500; // ms

    let lastActivityPoint: number | null = null;

    // Create a map of timestamps to app changes for quick lookup
    const appChanges = new Map<number, FrontmostApp>();

    // Initialize with the initial app at its timestamp
    appChanges.set(initialApp.timestamp, initialApp);

    // Add any subsequent app changes
    for (const event of events) {
      if (event.type === 'frontmost-app-changed') {
        const eventData = event.data[0];
        const newApp = {
          appName: eventData.frontmostApp.appName,
          appIdentifier: eventData.frontmostApp.appIdentifier,
          timestamp: event.timestamp,
        };
        appChanges.set(event.timestamp, newApp);
      }
    }

    for (const profile of itp) {
      if (profile.idleTime < ACTIVE_THRESHOLD) {
        // If this is the first activity point or enough time has passed since the last one
        if (lastActivityPoint === null || profile.timestamp - lastActivityPoint >= MIN_ACTIVITY_GAP) {
          // Find the most recent app change before this timestamp
          let appAtTimestamp = initialApp; // Default to initial app
          for (const [timestamp, app] of appChanges.entries()) {
            if (timestamp <= profile.timestamp) {
              appAtTimestamp = app;
            } else {
              break;
            }
          }

          points.push({
            timestamp: profile.timestamp,
            type: 'activity',
            metadata: {
              appName: appAtTimestamp.appName,
              appIdentifier: appAtTimestamp.appIdentifier,
              idleTime: profile.idleTime,
            },
          });
          lastActivityPoint = profile.timestamp;
        }
      }
    }

    return points;
  }

  async execute(job: IDhappJob, stepResults: Record<string, any>): Promise<IPipelineStepResult> {
    this.getLogger().info('Extracting points of interest from idle time profile and events');

    return this.retryWithBackoff(
      async () => {
        // Load data
        const chunkInfo = await this.loadChunkInfo(job);
        const itp = await this.loadIdleTimeProfile(job);
        const events = await this.loadEvents(job);

        // Extract points from both sources using the initial app from chunkInfo
        const appChangePoints = this.extractPointsFromAppChanges(events, chunkInfo.frontmostApp);
        const activityPoints = this.extractPointsFromActivity(itp, events, chunkInfo.frontmostApp);

        // Combine and sort all points by timestamp
        const allPoints = [...appChangePoints, ...activityPoints].sort((a, b) => a.timestamp - b.timestamp);

        this.getLogger().info(`Extracted ${allPoints.length} points of interest`);

        // Store points of interest in a file
        const sessionName = job.job_name.split('_')[0];
        const chunkNumber = job.job_name.split('_')[1];
        const pointsPath = path.join(job.job_session_directory, `${sessionName}-poi-chunk-${chunkNumber}.json`);
        try {
          await fs.writeFile(pointsPath, JSON.stringify(allPoints, null, 2));
        } catch (error) {
          this.getLogger().error(`Error writing points of interest to file: ${error}`);
          return {
            success: false,
            error: 'Failed to write points of interest to file',
          };
        }

        return {
          success: true,
          data: allPoints,
        };
      },
      job,
      'points of interest extraction',
    );
  }
}
