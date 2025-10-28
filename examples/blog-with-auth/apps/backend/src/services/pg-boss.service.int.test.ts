import {
  afterAll,
  assert,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import type { QueueJob } from '@src/types/queue.types.js';

import { createMockLogger } from '@src/tests/helpers/logger.test-helper.js';

import {
  cleanupOrphanedSchedules,
  createQueue,
  getScheduledJobs,
  initializePgBoss,
  shutdownPgBoss,
} from './pg-boss.service.js';

// Mock the logger module to avoid log output during tests
vi.mock('@src/services/logger.js', () => ({
  logger: createMockLogger(),
}));

// Helper to create promise that can be resolved externally
function createDeferred<T = void>(): {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (error: unknown) => void;
} {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

// Helper to sleep for a given time
const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

describe('pg-boss service integration tests', () => {
  beforeAll(async () => {
    // Initialize pg-boss in test mode with maintenance enabled
    await initializePgBoss();
  });

  afterAll(async () => {
    await shutdownPgBoss();
  });

  beforeEach(async () => {
    // Clean up any orphaned schedules from previous tests
    await cleanupOrphanedSchedules([]);
  });

  describe('basic job processing', () => {
    it('should process a simple job', async () => {
      const queueName = 'test-basic-queue';
      const deferred = createDeferred();
      let processedJob:
        | QueueJob<{ message: string; value: number }>
        | undefined;

      interface TestData {
        message: string;
        value: number;
      }

      const queue = createQueue<TestData>(queueName, {
        handler: (job) => {
          processedJob = job;
          deferred.resolve(undefined);
          return { processed: true };
        },
      });

      // Start the worker
      await queue.work();

      // Enqueue a job
      const jobId = await queue.enqueue({
        message: 'Hello, pg-boss!',
        value: 42,
      });

      expect(jobId).toBeDefined();

      // Wait for job to be processed
      await deferred.promise;

      // Verify job was processed correctly
      assert.isDefined(processedJob);
      expect(processedJob.data).toEqual({
        message: 'Hello, pg-boss!',
        value: 42,
      });
      expect(processedJob.name).toBe(queueName);
      expect(processedJob.attemptNumber).toBe(1);
    });

    it('should handle jobs enqueued before worker starts', async () => {
      const queueName = 'test-pre-enqueue';
      const deferred = createDeferred();
      let processedJob: QueueJob<{ id: number }> | undefined;

      const queue = createQueue<{ id: number }>(queueName, {
        handler: (job) => {
          processedJob = job;
          deferred.resolve(undefined);
        },
      });

      // Enqueue BEFORE starting worker
      const jobId = await queue.enqueue({ id: 123 });
      expect(jobId).toBeDefined();

      // Now start the worker
      await queue.work();

      // Job should still be processed
      await deferred.promise;

      assert.isDefined(processedJob);
      expect(processedJob.data).toEqual({ id: 123 });
    });
  });

  describe('error handling and retries', () => {
    it('should retry failed jobs with correct attempt numbers', async () => {
      const queueName = 'test-retry-queue';
      let attemptCount = 0;
      const deferred = createDeferred();
      const attempts: QueueJob<unknown>[] = [];

      const queue = createQueue<unknown>(queueName, {
        handler: (job) => {
          attemptCount++;
          attempts.push(job);

          // Fail on first attempt
          if (attemptCount === 1) {
            throw new Error('Simulated failure');
          }

          // Success on second attempt
          deferred.resolve(undefined);
          return { success: true };
        },
        options: {
          defaultJobOptions: {
            attempts: 3,
            backoff: {
              type: 'fixed',
              delaySeconds: 1, // 1 second retry delay
            },
          },
        },
      });

      await queue.work();

      // Enqueue a job
      await queue.enqueue({});

      // Wait for retry and successful processing
      await deferred.promise;

      // Should have been attempted twice
      expect(attemptCount).toBe(2);
      expect(attempts).toHaveLength(2);

      // Check attempt numbers
      expect(attempts[0].attemptNumber).toBe(1);
      expect(attempts[1].attemptNumber).toBe(2);
    });
  });

  describe('worker lifecycle', () => {
    it('should handle delayed jobs correctly', async () => {
      const queueName = 'test-delayed-queue';
      const deferred = createDeferred();
      let processedAt: number | undefined;

      const queue = createQueue<{ value: string }>(queueName, {
        handler: () => {
          processedAt = Date.now();
          deferred.resolve(undefined);
        },
      });

      await queue.work();

      const enqueuedAt = Date.now();
      await queue.enqueue(
        { value: 'delayed' },
        { delaySeconds: 1 }, // 1 second delay
      );

      // Job should not be processed immediately
      await sleep(500);
      expect(processedAt).toBeUndefined();

      // Wait for job to be processed
      await deferred.promise;

      // Should have been delayed by at least 1 second
      assert.isDefined(processedAt);
      const actualDelay = processedAt - enqueuedAt;
      expect(actualDelay).toBeGreaterThanOrEqual(900); // Allow some tolerance
    });
  });

  describe('cleanup', () => {
    it('should clean up orphaned schedules', async () => {
      const orphanedQueue = 'orphaned-repeatable-queue';

      // Create a queue with repeatable job
      const queue = createQueue<Record<string, never>>(orphanedQueue, {
        handler: async () => {
          // Do nothing
        },
        repeatable: {
          pattern: '*/5 * * * * *',
        },
      });

      await queue.work();

      const schedules = await getScheduledJobs();
      expect(schedules).toHaveLength(1);

      // Now clean up orphaned schedules (not including our queue)
      await cleanupOrphanedSchedules(['some-other-queue']);

      const schedulesAfterCleanup = await getScheduledJobs();
      expect(schedulesAfterCleanup).toHaveLength(0);
    });
  });
});
