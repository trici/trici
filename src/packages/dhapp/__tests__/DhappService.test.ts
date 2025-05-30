import { DhappService } from '../src/DhappService';
import { IDhappJob, IDhappJobRepository } from '@trici/dal';
import { DhappJobType } from '@trici/models';
import { getConsoleLogger, Logger } from '@trici/logger';
import path from 'path';
import fs from 'fs';

jest.mock('fs');

describe('DhappService', () => {
  let dhappService: DhappService;
  let mockJobRepository: jest.Mocked<IDhappJobRepository>;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    // Create mock repository
    mockJobRepository = {
      save: jest.fn(),
      get: jest.fn(),
      getJobToHandle: jest.fn(),
      getOneFailedJob: jest.fn(),
    };

    const ffmpegPath = path.join(__dirname, 'sampledata/ffmpeg');
    dhappService = new DhappService(mockJobRepository, ffmpegPath, getConsoleLogger);
  });

  describe('queueJob', () => {
    it('should throw an error if job session directory does not exist', () => {
      const testJob = {
        job_session_directory: '/nonexistent/dir',
        job_name: 'test-job',
        job_type: DhappJobType.FOCUS_SESSION_CHUNK,
      };

      (fs.existsSync as jest.Mock).mockReturnValue(false);

      expect(() => dhappService.queueJob(testJob)).toThrow(
        'Job session directory /nonexistent/dir/test-job does not exist',
      );
    });

    it('should successfully queue job if directory exists', async () => {
      const testJob = {
        job_session_directory: '/test/dir',
        job_name: 'test-job',
        job_type: DhappJobType.FOCUS_SESSION_CHUNK,
      };

      (fs.existsSync as jest.Mock).mockReturnValue(true);

      const expectedDhappJob: IDhappJob = {
        id: 1,
        job_session_directory: testJob.job_session_directory,
        job_name: testJob.job_name,
        job_type: testJob.job_type,
        status: 'pending',
        failure_type: 'none',
        steps_completed: {},
        error_message: null,
        attempt_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockJobRepository.save.mockResolvedValue(expectedDhappJob);

      const result = await dhappService.queueJob(testJob);

      expect(result).toEqual(expectedDhappJob);
      expect(mockJobRepository.save).toHaveBeenCalled();
    });
  });
});
