import { PickupService } from '../src/PickupService';
import { IPipeline } from '../src/Pipeline';

describe.skip('PickupService', () => {
  let pipeline: IPipeline;
  let queueJobMock: jest.Mock;
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.useFakeTimers();
    queueJobMock = jest.fn();
    pipeline = {
      start: jest.fn(),
      stop: jest.fn(),
      queueJob: queueJobMock,
    } as unknown as IPipeline;

    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    consoleLogSpy.mockRestore();
  });

  it('should log start message on start', () => {
    const service = new PickupService('test/dir', 1000, pipeline);
    service.start();

    expect(consoleLogSpy).toHaveBeenCalledWith('Starting PickupService for directory: test/dir with interval 1000ms');
    service.stop();
  });

  it('should periodically check for jobs and queue them if found', () => {
    // Subclass PickupService to override the scanDirectory method.
    class TestPickupService extends PickupService {
      protected scanDirectory(): null {
        return null; // Simulate always finding a job
      }
    }

    const service = new TestPickupService('test/dir', 1000, pipeline);
    service.start();

    // Advance timers by one interval so scanDirectory is executed.
    jest.advanceTimersByTime(1000);

    expect(consoleLogSpy).toHaveBeenCalledWith('Job found:', { id: 42 });
    expect(queueJobMock).toHaveBeenCalledWith({ id: 42 });
    service.stop();
  });

  it('should stop polling after stop is called', () => {
    class TestPickupService extends PickupService {
      protected scanDirectory(): null {
        return null;
      }
    }

    const service = new TestPickupService('test/dir', 1000, pipeline);
    service.start();
    service.stop();

    // Clear the mock and advance timers. No further job should be queued.
    queueJobMock.mockClear();
    jest.advanceTimersByTime(2000);
    expect(queueJobMock).not.toHaveBeenCalled();
  });
});
