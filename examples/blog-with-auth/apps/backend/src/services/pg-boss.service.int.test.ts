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

// Jobs that become runnable without being written (a retry off its backoff, an
// elapsed delay) emit no NOTIFY and are only found by the backstop poll. Tests
// covering those would otherwise idle for the production interval.
const FAST_POLL = { notifyPollingIntervalSeconds: 0.5 };

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

    it('should pick up a job without waiting out the poll interval', async () => {
      const queueName = 'test-notify-latency';
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

      // Let the worker get past its startup fetch and settle into the 2s idle
      // poll. Enqueueing immediately would be caught by that first fetch, which
      // passes whether or not NOTIFY is doing anything.
      await sleep(2200);

      const enqueuedAt = Date.now();
      await runtime.enqueue(token, { value: 'notify' });
      await deferred.promise;

      // Mid-cycle the next poll is up to 2s out, so a sub-second pickup can
      // only come from NOTIFY. Loose enough to stay stable on a loaded CI
      // database.
      assert.isDefined(processedAt);
      expect(processedAt - enqueuedAt).toBeLessThan(1000);
    }, 10_000);
  });

  describe('bulk enqueueing', () => {
    it('should enqueue and process many jobs in one call', async () => {
      const queueName = 'test-bulk-queue';
      const jobCount = 5;
      const deferred = createDeferred();
      const processedValues: number[] = [];

      const token = defineQueue<{ index: number }>(queueName);
      const binding = bindQueueHandler(token, {
        handler: (job) => {
          processedValues.push(job.data.index);
          if (processedValues.length === jobCount) {
            deferred.resolve(undefined);
          }
        },
      });

      runtime = createQueueRuntime([binding]);
      await runtime.startWorkers({ createContext: createTestServiceContext });

      const jobIds = await runtime.enqueueBulk(
        token,
        Array.from({ length: jobCount }, (_, index) => ({ data: { index } })),
      );

      expect(jobIds).toHaveLength(jobCount);

      await deferred.promise;

      // Jobs are fetched in batches, so arrival order is not guaranteed.
      expect(processedValues.toSorted((a, b) => a - b)).toEqual([
        0, 1, 2, 3, 4,
      ]);
    });

    it('should drop deduplicated jobs from a bulk enqueue', async () => {
      const queueName = 'test-bulk-dedup-queue';

      const token = defineQueue<{ value: string }>(queueName);
      const binding = bindQueueHandler(token, {
        handler: () => {
          // Never started - this test only asserts on what was written.
        },
        options: { deduplication: true },
      });

      runtime = createQueueRuntime([binding]);

      // An `exclusive` queue admits one job per singletonKey, so the three
      // sharing a key collapse to one and the returned ids come back short.
      const jobIds = await runtime.enqueueBulk(token, [
        { data: { value: 'a' }, options: { singletonKey: 'shared' } },
        { data: { value: 'b' }, options: { singletonKey: 'shared' } },
        { data: { value: 'c' }, options: { singletonKey: 'shared' } },
      ]);

      expect(jobIds).toHaveLength(1);
    });

    // enqueueBulk maps options through pg-boss's flat JobInsert shape rather
    // than the SendOptions `enqueue` uses, so the mapping needs its own cover.
    it('should apply per-job options in a bulk enqueue', async () => {
      const queueName = 'test-bulk-options-queue';
      const deferred = createDeferred();
      let processedAt: number | undefined;

      const token = defineQueue<{ value: string }>(queueName);
      const binding = bindQueueHandler(token, {
        handler: () => {
          processedAt = Date.now();
          deferred.resolve(undefined);
        },
      });

      runtime = createQueueRuntime([binding], FAST_POLL);
      await runtime.startWorkers({ createContext: createTestServiceContext });

      const enqueuedAt = Date.now();
      await runtime.enqueueBulk(token, [
        { data: { value: 'delayed' }, options: { delaySeconds: 1 } },
      ]);

      await deferred.promise;

      assert.isDefined(processedAt);
      expect(processedAt - enqueuedAt).toBeGreaterThanOrEqual(900);
    }, 10_000);

    it('should run jobs concurrently up to the queue concurrency', async () => {
      const queueName = 'test-bulk-concurrency-queue';
      const jobCount = 3;
      const deferred = createDeferred();
      let running = 0;
      let peakRunning = 0;

      const token = defineQueue<{ index: number }>(queueName);
      const binding = bindQueueHandler(token, {
        handler: async () => {
          running += 1;
          peakRunning = Math.max(peakRunning, running);
          // Hold the slot so overlapping handlers are observable; at
          // concurrency 1 each job would wait out the one before it.
          await sleep(150);
          running -= 1;

          if (peakRunning === jobCount) {
            deferred.resolve(undefined);
          }
        },
      });

      runtime = createQueueRuntime([binding], FAST_POLL);
      await runtime.startWorkers({ createContext: createTestServiceContext });

      await runtime.enqueueBulk(
        token,
        Array.from({ length: jobCount }, (_, index) => ({ data: { index } })),
      );

      await deferred.promise;

      expect(peakRunning).toBe(jobCount);
    }, 15_000);

    it('should serialize jobs when concurrency is 1', async () => {
      const queueName = 'test-bulk-serial-queue';
      const jobCount = 3;
      const deferred = createDeferred();
      let running = 0;
      let peakRunning = 0;
      let completed = 0;

      const token = defineQueue<{ index: number }>(queueName);
      const binding = bindQueueHandler(token, {
        handler: async () => {
          running += 1;
          peakRunning = Math.max(peakRunning, running);
          await sleep(50);
          running -= 1;
          completed += 1;

          if (completed === jobCount) {
            deferred.resolve(undefined);
          }
        },
        options: { concurrency: 1 },
      });

      runtime = createQueueRuntime([binding], FAST_POLL);
      await runtime.startWorkers({ createContext: createTestServiceContext });

      await runtime.enqueueBulk(
        token,
        Array.from({ length: jobCount }, (_, index) => ({ data: { index } })),
      );

      await deferred.promise;

      expect(peakRunning).toBe(1);
    }, 15_000);

    it('should return an empty array without enqueueing', async () => {
      const queueName = 'test-bulk-empty-queue';

      const token = defineQueue<{ value: string }>(queueName);
      const binding = bindQueueHandler(token, {
        handler: () => {
          // Never started.
        },
      });

      runtime = createQueueRuntime([binding]);

      await expect(runtime.enqueueBulk(token, [])).resolves.toEqual([]);
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

      runtime = createQueueRuntime([binding], FAST_POLL);
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
    }, 10_000);

    it('should retry only the failing job of a batch', async () => {
      const queueName = 'test-mixed-batch-queue';
      const deferred = createDeferred();
      const attempts: { index: number; attemptNumber: number }[] = [];

      const token = defineQueue<{ index: number }>(queueName);
      const binding = bindQueueHandler(token, {
        handler: (job) => {
          attempts.push({
            index: job.data.index,
            attemptNumber: job.attemptNumber,
          });

          if (job.data.index === 1 && job.attemptNumber === 1) {
            throw new Error('Simulated failure');
          }

          if (job.data.index === 1) {
            deferred.resolve(undefined);
          }
        },
        options: {
          defaultJobOptions: {
            attempts: 3,
            backoff: { type: 'fixed', delaySeconds: 1 },
          },
        },
      });

      runtime = createQueueRuntime([binding], FAST_POLL);
      await runtime.startWorkers({ createContext: createTestServiceContext });

      // Workers fetch in batches, so these arrive at the handler together. The
      // handler settles each job individually, which has to hold even though
      // one member of the batch fails: the successful jobs must not be retried
      // and the failed one must not be marked complete.
      await runtime.enqueueBulk(token, [
        { data: { index: 0 } },
        { data: { index: 1 } },
        { data: { index: 2 } },
      ]);

      await deferred.promise;

      expect(attempts.filter((attempt) => attempt.index === 0)).toHaveLength(1);
      expect(attempts.filter((attempt) => attempt.index === 2)).toHaveLength(1);
      expect(
        attempts
          .filter((attempt) => attempt.index === 1)
          .map((attempt) => attempt.attemptNumber),
      ).toEqual([1, 2]);
    }, 15_000);
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

      runtime = createQueueRuntime([binding], FAST_POLL);
      await runtime.startWorkers({
        createContext: createTestServiceContext,
      });

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
    }, 10_000);
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
