import type { Job, JobsOptions } from 'bullmq';

import { Queue as BullMQQueueBase, Worker as BullMQWorker } from 'bullmq';

import type {
  EnqueueOptions,
  QueueHandlerBinding,
  QueueInfo,
  QueueJob,
  QueueRuntime,
  QueueToken,
  RepeatableConfig,
  ScheduledJob,
} from '../types/queue.types.js';
import type { ServiceContext } from '../utils/service-context.js';

import { config } from './config.js';
import { logError } from './error-logger.js';
import { logger } from './logger.js';
import { createRedisClient } from './redis.js';

/**
 * Days to retain completed jobs.
 */
const DELETE_AFTER_DAYS = /* TPL_DELETE_AFTER_DAYS:START */ 7; /* TPL_DELETE_AFTER_DAYS:END */

const MAX_REPEATABLE_JOBS_PER_QUEUE = 3;

/**
 * Awaits every promise and returns the rejection reasons, if any, instead of
 * short-circuiting on the first failure.
 * @param promises The promises to settle.
 * @returns The rejection reason of each promise that rejected.
 */
async function collectRejections(
  promises: Promise<unknown>[],
): Promise<unknown[]> {
  const results = await Promise.allSettled(promises);
  const reasons: unknown[] = [];
  for (const result of results) {
    if (result.status === 'rejected') {
      reasons.push(result.reason as unknown);
    }
  }
  return reasons;
}

/**
 * Ensure a deduplicated queue is never enqueued to without a singleton key.
 *
 * Enqueueing without a key on a deduplicated queue is almost always a mistake:
 * the job silently bypasses deduplication entirely, so callers relying on
 * idempotency would get duplicate jobs.
 *
 * @param queueName The name of the queue.
 * @param binding The queue's erased handler binding.
 * @param singletonKey The resolved singleton key for this job, if any.
 */
function assertSingletonKeyIfDeduplicated(
  queueName: string,
  binding: QueueHandlerBinding,
  singletonKey: string | undefined,
): void {
  if (binding.options?.deduplication && singletonKey === undefined) {
    throw new Error(
      `Queue "${queueName}" has deduplication enabled, so every job must be enqueued with a singletonKey.`,
    );
  }
}

function mapEnqueueOptions(options?: EnqueueOptions): JobsOptions {
  const bullMQOptions: JobsOptions = {
    // Keep completed jobs for specified days
    removeOnComplete: {
      age: DELETE_AFTER_DAYS * 24 * 60 * 60, // Convert days to seconds
      count: 100,
    },
    // Keep failed jobs for manual inspection
    removeOnFail: false,
  };

  if (options?.singletonKey !== undefined) {
    // No ttl: BullMQ holds the deduplication key until the job moves to
    // completed or failed, so jobs are deduplicated while pending or active.
    // Setting a ttl would instead keep the key alive past completion, turning
    // this into time-window throttling.
    bullMQOptions.deduplication = { id: options.singletonKey };
  }

  if (options?.delaySeconds) {
    bullMQOptions.delay = options.delaySeconds * 1000; // Convert to milliseconds
  }

  if (options?.priority !== undefined) {
    bullMQOptions.priority = options.priority;
  }

  if (options?.attempts !== undefined) {
    bullMQOptions.attempts = options.attempts;
  }

  if (options?.backoff) {
    const { type, delaySeconds } = options.backoff;

    bullMQOptions.backoff = {
      type: type === 'exponential' ? 'exponential' : 'fixed',
      delay: delaySeconds * 1000, // Convert to milliseconds
    };
  }

  return bullMQOptions;
}

function mapBullMQJob<T>(bullJob: Job<T>): QueueJob<T> {
  return {
    id: bullJob.id ?? 'unknown',
    name: bullJob.queueName,
    data: bullJob.data,
    // attemptsMade is 0 on first attempt, so add 1 to match our interface
    attemptNumber: bullJob.attemptsMade + 1,
  };
}

async function setupRepeatableJobs(
  queue: BullMQQueueBase,
  queueName: string,
  repeatable: RepeatableConfig | RepeatableConfig[],
): Promise<void> {
  const configs = Array.isArray(repeatable) ? repeatable : [repeatable];

  if (configs.length > MAX_REPEATABLE_JOBS_PER_QUEUE) {
    throw new Error(
      `Too many repeatable jobs configured for queue ${queueName}. Maximum is ${MAX_REPEATABLE_JOBS_PER_QUEUE}.`,
    );
  }

  for (let i = 0; i < MAX_REPEATABLE_JOBS_PER_QUEUE; i++) {
    const jobConfig = configs.at(i);
    const name = `${queueName}-repeatable-${i}`;
    if (jobConfig?.pattern) {
      await queue.upsertJobScheduler(name, { pattern: jobConfig.pattern }, {});
      logger.info(
        {
          queueName,
          pattern: jobConfig.pattern,
          event: 'repeatable-job-scheduled',
        },
        'Scheduled repeatable job',
      );
    } else {
      await queue.removeJobScheduler(name);
    }
  }
}

/**
 * Constructs a {@link QueueRuntime} backed by BullMQ from a list of handler
 * bindings collected from the app module tree.
 *
 * Passively allocates: the Redis connection and BullMQ Queue/Worker instances
 * are created lazily on first use, not here, so construction performs no I/O.
 *
 * @param bindings Every queue handler binding registered across app modules.
 * @returns A {@link QueueRuntime} for enqueueing jobs and running workers.
 * @throws If two bindings share the same token name.
 */
export function createQueueRuntime(
  bindings: QueueHandlerBinding[],
): QueueRuntime {
  const seenNames = new Set<string>();
  for (const binding of bindings) {
    if (seenNames.has(binding.token.name)) {
      throw new Error(
        `Duplicate queue binding name "${binding.token.name}". Queue names must be unique across all app modules.`,
      );
    }
    seenNames.add(binding.token.name);
  }

  const bindingsByName = new Map(
    bindings.map((binding) => [binding.token.name, binding]),
  );

  let redisClient: ReturnType<typeof createRedisClient> | undefined;
  const bullQueues = new Map<string, BullMQQueueBase>();
  const bullWorkers = new Map<string, BullMQWorker>();

  function getRedisClient(): ReturnType<typeof createRedisClient> {
    redisClient ??= createRedisClient({ usePrefix: false });
    return redisClient;
  }

  function getBullQueue(binding: QueueHandlerBinding): BullMQQueueBase {
    const { name } = binding.token;
    let bullQueue = bullQueues.get(name);
    if (!bullQueue) {
      bullQueue = new BullMQQueueBase(name, {
        connection: getRedisClient(),
        prefix: config.REDIS_KEY_PREFIX,
        defaultJobOptions: mapEnqueueOptions(
          binding.options?.defaultJobOptions,
        ),
      });
      bullQueue.on('error', (error: Error) => {
        logError(error, { source: 'bullmq-queue', queueName: name });
      });
      bullQueues.set(name, bullQueue);
    }
    return bullQueue;
  }

  async function enqueue<T>(
    token: QueueToken<T>,
    data: T,
    options?: EnqueueOptions,
  ): Promise<string | undefined> {
    const binding = bindingsByName.get(token.name);
    if (!binding) {
      throw new Error(
        `No handler bound for queue "${token.name}". Bind one with bindQueueHandler().`,
      );
    }

    const mergedOptions: EnqueueOptions = {
      ...binding.options?.defaultJobOptions,
      ...options,
    };

    assertSingletonKeyIfDeduplicated(
      token.name,
      binding,
      mergedOptions.singletonKey,
    );

    const bullMQOptions = mapEnqueueOptions(mergedOptions);
    // When a job is deduplicated, BullMQ does not store it and instead returns
    // the id of the job that is already in flight, so the id below may belong
    // to that existing job rather than a newly created one. Callers must not
    // treat the returned id as proof that a new job was created.
    const job = await getBullQueue(binding).add(
      token.name,
      data,
      bullMQOptions,
    );

    return job.id;
  }

  async function startWorkers(options: {
    createContext: () => ServiceContext;
  }): Promise<void> {
    const startedWorkers: BullMQWorker[] = [];

    async function startOne(binding: QueueHandlerBinding): Promise<void> {
      const { name } = binding.token;

      // Resolve any lazyHandler now, so a broken dynamic import fails
      // startup instead of surfacing as a job failure/retry later.
      await binding.resolve();

      const bullQueue = getBullQueue(binding);

      if (binding.repeatable) {
        await setupRepeatableJobs(bullQueue, name, binding.repeatable);
      }

      const worker = new BullMQWorker(
        name,
        async (job: Job) => {
          // A fresh context per job: execution-scoped caches (auth,
          // authorizer model lookups) must not leak across unrelated jobs.
          const ctx = options.createContext();
          const queueJob = mapBullMQJob(job);

          logger.info(
            {
              queueName: name,
              jobId: job.id,
              attemptNumber: queueJob.attemptNumber,
              event: 'job-processing-started',
            },
            `Processing job ${job.id ?? 'unknown'} for queue ${name} (attempt ${queueJob.attemptNumber})`,
          );

          try {
            const result = await binding.invoke(queueJob, ctx);

            logger.info(
              {
                queueName: name,
                jobId: job.id,
                event: 'job-processing-completed',
                result,
              },
              `Job ${job.id ?? 'unknown'} for queue ${name} completed successfully`,
            );

            return result;
          } catch (error: unknown) {
            logError(error, {
              queueName: name,
              jobId: job.id,
              attemptNumber: queueJob.attemptNumber,
              event: 'job-processing-failed',
            });

            throw error;
          }
        },
        {
          connection: getRedisClient(),
          prefix: config.REDIS_KEY_PREFIX,
        },
      );

      worker.on('error', (error: Error) => {
        logError(error, { source: 'bullmq-worker', queueName: name });
      });

      await worker.waitUntilReady();

      bullWorkers.set(name, worker);
      startedWorkers.push(worker);

      logger.info(
        {
          queueName: name,
          hasRepeatable: !!binding.repeatable,
          event: 'queue-worker-started',
        },
        'Queue worker started',
      );
    }

    try {
      await Promise.all(bindings.map((binding) => startOne(binding)));
    } catch (error: unknown) {
      // Roll back any workers that did start, so a partial failure doesn't
      // leave some queues silently processing jobs while boot reports failure.
      await Promise.all(startedWorkers.map((worker) => worker.close()));
      for (const worker of startedWorkers) {
        bullWorkers.delete(worker.name);
      }
      throw error;
    }
  }

  /**
   * Closes workers, then queues, then Redis, in that order - always
   * attempting every stage even if an earlier one fails, so one rejection
   * (e.g. a stuck worker) can't leave queue handles or the Redis connection
   * open. Aggregates every failure instead of surfacing only the first.
   */
  async function stopWorkers(): Promise<void> {
    const errors: unknown[] = [];

    const workerErrors = await collectRejections(
      [...bullWorkers.values()].map((worker) => worker.close()),
    );
    errors.push(...workerErrors);
    bullWorkers.clear();

    const queueErrors = await collectRejections(
      [...bullQueues.values()].map((queue) => queue.close()),
    );
    errors.push(...queueErrors);
    bullQueues.clear();

    if (redisClient) {
      const client = redisClient;
      redisClient = undefined;
      const redisErrors = await collectRejections([client.quit()]);
      errors.push(...redisErrors);
    }

    if (errors.length > 0) {
      throw new AggregateError(errors, 'Failed to stop queue workers');
    }
  }

  function listQueues(): QueueInfo[] {
    return bindings.map((binding) => ({ name: binding.token.name }));
  }

  async function getScheduledJobs(): Promise<ScheduledJob[]> {
    const scheduled: ScheduledJob[] = [];

    for (const [name, bullQueue] of bullQueues) {
      const schedulers = await bullQueue.getJobSchedulers();
      if (schedulers.length > 0) {
        scheduled.push({ name });
      }
    }

    return scheduled;
  }

  return {
    enqueue,
    startWorkers,
    stopWorkers,
    listQueues,
    getScheduledJobs,
  };
}
