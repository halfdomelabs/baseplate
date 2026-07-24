import { afterEach, assert, describe, expect, it, vi } from 'vitest';

import type { QueueJob, QueueRuntime } from '@src/types/queue.types.js';

import { createMockLogger } from '@src/tests/helpers/logger.test-helper.js';
import { createTestServiceContext } from '@src/tests/helpers/service-context.test-helper.js';
import { bindQueueHandler, defineQueue } from '@src/types/queue.types.js';

import { createQueueRuntime } from './pg-boss.service.js';

// Mock the logger module to avoid log output during tests
vi.mock('@src/services/logger.js', () => ({
  logger: createMockLogger(),
}));

/**
 * Note: These integration tests require a real Postgres instance to run
 * properly, since pg-boss is backed by Postgres tables.
 */

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
  let runtime: QueueRuntime | undefined;

  afterEach(async () => {
    await runtime?.stopWorkers();
    runtime = undefined;
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

      const token = defineQueue<TestData>(queueName);
      const binding = bindQueueHandler(token, {
        handler: (job) => {
          processedJob = job;
          deferred.resolve(undefined);
          return { processed: true };
        },
      });

      runtime = createQueueRuntime([binding]);
      await runtime.startWorkers({
        createContext: createTestServiceContext,
      });

      // Enqueue a job
      const jobId = await runtime.enqueue(token, {
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

      const token = defineQueue<{ id: number }>(queueName);
      const binding = bindQueueHandler(token, {
        handler: (job) => {
          processedJob = job;
          deferred.resolve(undefined);
        },
      });

      runtime = createQueueRuntime([binding]);

      // Enqueue BEFORE starting worker
      const jobId = await runtime.enqueue(token, { id: 123 });
      expect(jobId).toBeDefined();

      // Now start the worker
      await runtime.startWorkers({ createContext: createTestServiceContext });

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

      const token = defineQueue<unknown>(queueName);
      const binding = bindQueueHandler(token, {
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

      runtime = createQueueRuntime([binding]);
      await runtime.startWorkers({ createContext: createTestServiceContext });

      // Enqueue a job
      await runtime.enqueue(token, {});

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

      const token = defineQueue<{ value: string }>(queueName);
      const binding = bindQueueHandler(token, {
        handler: () => {
          processedAt = Date.now();
          deferred.resolve(undefined);
        },
      });

      runtime = createQueueRuntime([binding]);
      await runtime.startWorkers({ createContext: createTestServiceContext });

      const enqueuedAt = Date.now();
      await runtime.enqueue(
        token,
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

      const token = defineQueue<Record<string, never>>(orphanedQueue);
      const binding = bindQueueHandler(token, {
        handler: async () => {
          // Do nothing
        },
        repeatable: {
          pattern: '*/5 * * * * *',
        },
      });

      runtime = createQueueRuntime([binding]);
      await runtime.startWorkers({ createContext: createTestServiceContext });

      const schedules = await runtime.getScheduledJobs();
      expect(schedules).toHaveLength(1);

      // Stop this runtime's workers, then verify a fresh runtime with no
      // bindings treats the previous runtime's schedule as orphaned.
      await runtime.stopWorkers();

      const emptyRuntime = createQueueRuntime([]);
      await emptyRuntime.startWorkers({
        createContext: createTestServiceContext,
      });
      runtime = emptyRuntime;

      const schedulesAfterCleanup = await runtime.getScheduledJobs();
      expect(schedulesAfterCleanup).toHaveLength(0);
    });
  });
});
