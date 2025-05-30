import { Pipeline } from '../src/Pipeline';
import { DhappJobType } from '@trici/models';
import { IDhappJob, IDhappJobRepository } from '@trici/dal';
import { getConsoleLogger } from '@trici/logger';
import path from 'path';

describe('Pipeline', () => {
  let pipeline: Pipeline;
  let mockJobRepository: jest.Mocked<IDhappJobRepository>;

  beforeEach(() => {
    // Create mock repository
    mockJobRepository = {
      save: jest.fn(),
      get: jest.fn(),
      getJobToHandle: jest.fn(),
      getOneFailedJob: jest.fn(),
    };

    const ffmpegPath = path.join(__dirname, 'sampledata/ffmpeg');
    pipeline = new Pipeline(mockJobRepository, ffmpegPath, getConsoleLogger);
  });

  afterEach(() => {
    // Clean up any intervals
    pipeline.stop();
    jest.clearAllMocks();
  });

  describe('start', () => {
    it('should start the job picker interval', () => {
      const setIntervalSpy = jest.spyOn(global, 'setInterval');
      pipeline.start();

      expect(setIntervalSpy).toHaveBeenCalled();
      expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 5000);
    });
  });

  describe('stop', () => {
    it('should clear the job picker interval', () => {
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
      pipeline.start();
      pipeline.stop();

      expect(clearIntervalSpy).toHaveBeenCalled();
    });
  });

  describe('queueJob', () => {
    it('should create a new job in the repository', async () => {
      const testJob = {
        job_session_directory: '/test/dir',
        job_name: 'test-job',
        job_type: DhappJobType.FOCUS_SESSION_CHUNK,
      };

      const expectedDhappJob: Omit<IDhappJob, 'created_at' | 'updated_at'> = {
        id: -1,
        job_session_directory: testJob.job_session_directory,
        job_name: testJob.job_name,
        job_type: testJob.job_type,
        status: 'pending',
        failure_type: 'none',
        steps_completed: {},
        error_message: null,
        attempt_count: 0,
      };

      mockJobRepository.save.mockResolvedValue({
        ...expectedDhappJob,
        id: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      const result = await pipeline.queueJob(testJob);

      expect(mockJobRepository.save).toHaveBeenCalledWith(expectedDhappJob);
      expect(result).toEqual(
        expect.objectContaining({
          job_session_directory: testJob.job_session_directory,
          job_name: testJob.job_name,
          status: 'pending',
        }),
      );
    });
  });
});
