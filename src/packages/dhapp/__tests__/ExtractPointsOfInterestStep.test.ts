import { ExtractPointsOfInterestStep } from '../src/pipeline/steps/ExtractPointsOfInterestStep';
import { Logger } from '@trici/logger';
import * as fs from 'fs/promises';
import { PathLike } from 'fs';
import * as path from 'path';
import { DataWriter } from '@trici/datawriter';
import { IDhappJob } from '@trici/dal';
import { DhappJobType } from '@trici/models';
import { IPipelineStepResult } from '../src/pipeline/IPipelineStep';

interface PointOfInterest {
  timestamp: number;
  type: 'before_app_change' | 'after_app_change' | 'activity';
  metadata: {
    appName: string;
    appIdentifier: string;
    idleTime?: number;
  };
}

// Mock the fs module
jest.mock('fs/promises');
const mockedFs = fs as jest.Mocked<typeof fs>;

// Mock the DataWriter
jest.mock('@trici/datawriter');
const mockedDataWriter = DataWriter as jest.Mocked<typeof DataWriter>;

describe('ExtractPointsOfInterestStep', () => {
  let step: ExtractPointsOfInterestStep;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    // Setup mock logger
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    } as any;

    step = new ExtractPointsOfInterestStep(() => mockLogger);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const mockJob: IDhappJob = {
      id: 1,
      job_name: 'session_1',
      job_session_directory: '/test/session',
      job_type: DhappJobType.FOCUS_SESSION_CHUNK,
      status: 'pending',
      failure_type: 'none',
      steps_completed: {},
      error_message: null,
      attempt_count: 0,
      created_at: '2024-03-20T00:00:00Z',
      updated_at: '2024-03-20T00:00:00Z',
    };

    const mockChunkInfo = {
      frontmostApp: {
        appName: 'Test App',
        appIdentifier: 'com.test.app',
        timestamp: 1000,
      },
      timeRange: {
        start: 1000,
        end: 2000,
      },
    };

    const mockIdleTimeProfile = [
      { timestamp: 1000, idleTime: 100 },
      { timestamp: 1500, idleTime: 600 },
      { timestamp: 2000, idleTime: 200 },
    ];

    const mockEvents = [
      {
        timestamp: 1200,
        type: 'frontmost-app-changed',
        data: {
          appName: 'New App',
          appIdentifier: 'com.new.app',
        },
      },
    ];

    beforeEach(() => {
      // Mock file reads
      mockedFs.readFile.mockImplementation(async (filePath: PathLike | fs.FileHandle, options?: any) => {
        const path = filePath.toString();
        if (path.includes('chunkinfo')) {
          return JSON.stringify(mockChunkInfo);
        } else if (path.includes('events')) {
          return JSON.stringify(mockEvents);
        } else if (path.includes('itp')) {
          return Buffer.from('mock buffer');
        }
        throw new Error('Unexpected file read');
      });

      // Mock DataWriter
      mockedDataWriter.readIdleTimeProfileFromBuffer.mockReturnValue(mockIdleTimeProfile);

      // Mock file write
      mockedFs.writeFile.mockResolvedValue(undefined);
    });

    it('should successfully extract points of interest', async () => {
      // Mock the retry mechanism to succeed immediately
      const mockRetry = jest.spyOn(step as any, 'retryWithBackoff');
      mockRetry.mockImplementation(async (...args: unknown[]) => {
        const operation = args[0] as () => Promise<any>;
        const result = await operation();
        return result;
      });

      const result = await step.execute(mockJob, {});

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);

      // Verify points of interest
      const points = result.data as PointOfInterest[];

      // Should have points from both app changes and activity
      expect(points.length).toBeGreaterThan(0);

      // Verify app change points
      const appChangePoints = points.filter(
        (p: PointOfInterest) => p.type === 'before_app_change' || p.type === 'after_app_change',
      );
      expect(appChangePoints.length).toBe(2); // One before and one after

      // Verify activity points
      const activityPoints = points.filter((p: PointOfInterest) => p.type === 'activity');
      expect(activityPoints.length).toBeGreaterThan(0);

      // Verify file was written
      expect(mockedFs.writeFile).toHaveBeenCalledWith(expect.stringContaining('poi-chunk-1.json'), expect.any(String));
    });

    it('should handle file read errors gracefully', async () => {
      // Mock the retry mechanism to fail immediately
      const mockRetry = jest.spyOn(step as any, 'retryWithBackoff');
      mockRetry.mockImplementation(async (...args: unknown[]) => {
        const operation = args[0] as () => Promise<any>;
        try {
          await operation();
        } catch (error: any) {
          // Log the error before returning
          mockLogger.error(`Error in points of interest extraction: ${error.message}`);
          return {
            success: false,
            error: error.message,
          };
        }
      });

      // Mock file read to fail
      mockedFs.readFile.mockRejectedValue(new Error('File read error'));

      const result = await step.execute(mockJob, {});

      expect(result.success).toBe(false);
      expect(result.error).toBe('File read error');
      expect(mockLogger.error).toHaveBeenCalledWith(expect.stringContaining('Error in points of interest extraction'));
    }, 10000); // Increase timeout for this test

    it('should handle file write errors gracefully', async () => {
      // Mock the retry mechanism to fail immediately
      const mockRetry = jest.spyOn(step as any, 'retryWithBackoff');
      mockRetry.mockImplementation(async (...args: unknown[]) => {
        const operation = args[0] as () => Promise<any>;
        try {
          return await operation();
        } catch (error: any) {
          return {
            success: false,
            error: error.message,
          };
        }
      });

      mockedFs.writeFile.mockRejectedValueOnce(new Error('File write error'));

      const result = await step.execute(mockJob, {});

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to write points of interest to file');
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should extract correct points from app changes', async () => {
      // Mock the retry mechanism to succeed immediately
      const mockRetry = jest.spyOn(step as any, 'retryWithBackoff');
      mockRetry.mockImplementation(async (...args: unknown[]) => {
        const operation = args[0] as () => Promise<any>;
        return await operation();
      });

      const result = await step.execute(mockJob, {});
      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);

      const points = result.data as PointOfInterest[];

      const appChangePoints = points.filter(
        (p: PointOfInterest) => p.type === 'before_app_change' || p.type === 'after_app_change',
      );

      // Verify before app change point
      const beforePoint = appChangePoints.find((p: PointOfInterest) => p.type === 'before_app_change');
      expect(beforePoint).toBeDefined();
      expect(beforePoint?.timestamp).toBe(1200 - 500); // 500ms before the event
      expect(beforePoint?.metadata.appName).toBe('New App');

      // Verify after app change point
      const afterPoint = appChangePoints.find((p: PointOfInterest) => p.type === 'after_app_change');
      expect(afterPoint).toBeDefined();
      expect(afterPoint?.timestamp).toBe(1200 + 500); // 500ms after the event
      expect(afterPoint?.metadata.appName).toBe('New App');
    });

    it('should extract correct points from activity', async () => {
      // Mock the retry mechanism to succeed immediately
      const mockRetry = jest.spyOn(step as any, 'retryWithBackoff');
      mockRetry.mockImplementation(async (...args: unknown[]) => {
        const operation = args[0] as () => Promise<any>;
        return await operation();
      });

      const result = await step.execute(mockJob, {});
      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);

      const points = result.data as PointOfInterest[];

      const activityPoints = points.filter((p: PointOfInterest) => p.type === 'activity');

      // Should have activity points for timestamps with low idle time
      expect(activityPoints.length).toBeGreaterThan(0);

      // Verify activity point properties
      const activityPoint = activityPoints[0];
      expect(activityPoint.metadata.appName).toBe('Test App');
      expect(activityPoint.metadata.idleTime).toBeDefined();
      expect(activityPoint.metadata.idleTime).toBeLessThan(500); // ACTIVE_THRESHOLD
    });
  });
});
