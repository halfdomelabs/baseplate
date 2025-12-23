import type { Job, JobsOptions } from 'bullmq';

import { Queue as BullMQQueueBase, Worker as BullMQWorker } from 'bullmq';

import type {
  EnqueueOptions,
  QueueDefinition,
  Queue as QueueInterface,
  QueueJob,
  RepeatableConfig,
} from '../types/queue.types.js';

import { config } from './config.js';
import { logError } from './error-logger.js';
import { logger } from './logger.js';
import { createRedisClient } from './redis.js';

/**
 * Global registry of active queues and workers.
 */
const activeQueues = new Map<string, BullMQQueueBase>();
const activeWorkers = new Map<string, BullMQWorker>();

/**
 * Redis connection for BullMQ operations.
 */
let bullMQRedisClient: ReturnType<typeof createRedisClient> | undefined =
  undefined;

/**
 * Days to retain completed jobs.
 */
const DELETE_AFTER_DAYS = /* TPL_DELETE_AFTER_DAYS:START */ 7; /* TPL_DELETE_AFTER_DAYS:END */

/**
 * Initialize the BullMQ system with Redis connection.
 */
export function initializeBullMQ(): void {
  if (bullMQRedisClient) {
    return;
  }

  // Create dedicated Redis connection for BullMQ
  bullMQRedisClient = createRedisClient({ usePrefix: false });
}

/**
 * Shutdown the BullMQ system, closing all queues and workers.
 * @returns Promise that resolves when BullMQ is stopped.
 */
export async function shutdownBullMQ(): Promise<void> {
  // Close all workers first
  await Promise.all(
    [...activeWorkers.values()].map((worker) => worker.close()),
  );
  activeWorkers.clear();

  // Close all queues
  await Promise.all([...activeQueues.values()].map((queue) => queue.close()));
  activeQueues.clear();

  // Close Redis connection
  if (bullMQRedisClient) {
    await bullMQRedisClient.quit();
    bullMQRedisClient = undefined;
  }
}

/**
 * Get the BullMQ Redis client, throwing if not initialized.
 * @returns The Redis client instance.
 */
function getBullMQRedis(): ReturnType<typeof createRedisClient> {
  if (!bullMQRedisClient) {
    throw new Error('BullMQ not initialized. Call initializeBullMQ() first.');
  }
  return bullMQRedisClient;
}

/**
 * Convert our EnqueueOptions to BullMQ job options.
 * @param options The enqueue options from our interface.
 * @returns BullMQ job options.
 */
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

/**
 * Convert BullMQ job to our QueueJob interface.
 * @param bullJob The BullMQ job object.
 * @returns Our QueueJob interface.
 */
function mapBullMQJob<T>(bullJob: Job<T>): QueueJob<T> {
  return {
    id: bullJob.id ?? 'unknown',
    name: bullJob.queueName,
    data: bullJob.data,
    // attemptsMade is 0 on first attempt, so add 1 to match our interface
    attemptNumber: bullJob.attemptsMade + 1,
  };
}

const MAX_REPEATABLE_JOBS_PER_QUEUE = 3;

/**
 * Setup repeatable jobs for a queue.
 * @param queue The BullMQ queue instance.
 * @param queueName The name of the queue.
 * @param repeatable The repeatable configuration.
 */
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
    const config = configs.at(i);
    const name = `${queueName}-repeatable-${i}`;
    if (config?.pattern) {
      await queue.upsertJobScheduler(name, { pattern: config.pattern }, {});
      logger.info(
        {
          queueName,
          pattern: config.pattern,
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
 * Implementation of Queue interface backed by BullMQ.
 */
export class BullMQQueue<T> implements QueueInterface<T> {
  private bullQueue: BullMQQueueBase | undefined = undefined;
  private worker?: BullMQWorker<T>;
  private isWorkerStarted = false;

  public getBullQueue(): BullMQQueueBase {
    if (!this.bullQueue) {
      const redis = getBullMQRedis();
      const prefix = config.REDIS_KEY_PREFIX;

      this.bullQueue = new BullMQQueueBase<T>(this.name, {
        connection: redis,
        prefix,
        defaultJobOptions: mapEnqueueOptions(
          this.definition.options?.defaultJobOptions,
        ),
      });

      // Register in active queues
      activeQueues.set(this.name, this.bullQueue);

      // Set up error handling
      this.bullQueue.on('error', (error: Error) => {
        logError(error, { source: 'bullmq-queue', queueName: this.name });
      });
    }
    return this.bullQueue;
  }

  constructor(
    public readonly name: string,
    private readonly definition: QueueDefinition<T>,
  ) {}

  async enqueue(
    data: T,
    options?: EnqueueOptions,
  ): Promise<string | undefined> {
    // Merge default job options with per-job options
    const mergedOptions: EnqueueOptions = {
      ...this.definition.options?.defaultJobOptions,
      ...options,
    };

    const bullMQOptions = mapEnqueueOptions(mergedOptions);
    const job = await this.getBullQueue().add(this.name, data, bullMQOptions);

    return job.id;
  }

  async work(): Promise<void> {
    if (this.isWorkerStarted) {
      logger.warn(
        { queueName: this.name, event: 'worker-already-started' },
        'Worker already started for queue',
      );
      return;
    }

    // Set up repeatable jobs if configured
    if (this.definition.repeatable) {
      await setupRepeatableJobs(
        this.getBullQueue(),
        this.name,
        this.definition.repeatable,
      ).catch((err: unknown) => {
        logError(err, {
          source: 'bullmq',
          event: 'repeatable-job-setup-failed',
        });
      });
    }

    const redis = getBullMQRedis();
    const prefix = config.REDIS_KEY_PREFIX;

    // Create worker
    this.worker = new BullMQWorker<T>(
      this.name,
      async (job: Job<T>) => {
        const queueJob = mapBullMQJob(job);

        logger.info(
          {
            queueName: this.name,
            jobId: job.id,
            attemptNumber: queueJob.attemptNumber,
            event: 'job-processing-started',
          },
          `Processing job ${job.id} for queue ${this.name} (attempt ${queueJob.attemptNumber})`,
        );

        try {
          const result = await this.definition.handler(queueJob);

          logger.info(
            {
              queueName: this.name,
              jobId: job.id,
              event: 'job-processing-completed',
              result,
            },
            `Job ${job.id} for queue ${this.name} completed successfully`,
          );

          return result;
        } catch (error: unknown) {
          logger.error(
            {
              queueName: this.name,
              jobId: job.id,
              attemptNumber: queueJob.attemptNumber,
              err: error,
              event: 'job-processing-failed',
            },
            `Job ${job.id} for queue ${this.name} failed`,
          );

          throw error;
        }
      },
      {
        connection: redis,
        prefix,
      },
    );

    // Register in active workers
    activeWorkers.set(this.name, this.worker);

    // Set up worker error handling
    this.worker.on('error', (error: Error) => {
      logError(error, { source: 'bullmq-worker', queueName: this.name });
    });

    this.isWorkerStarted = true;

    logger.info(
      {
        queueName: this.name,
        hasRepeatable: !!this.definition.repeatable,
        event: 'queue-worker-started',
      },
      'Queue worker started',
    );
  }
}

/**
 * Create a queue with the specified name and definition.
 * The worker is not started automatically - call queue.work() to start processing jobs.
 *
 * @param name The name of the queue.
 * @param definition The queue definition containing handler and options.
 * @returns A Queue interface for enqueuing jobs and starting workers.
 */
export function createQueue<T>(
  name: string,
  definition: QueueDefinition<T>,
): BullMQQueue<T> {
  return new BullMQQueue(name, definition);
}

/**
 * Get all scheduled/cron jobs from BullMQ.
 * @returns Promise that resolves to array of scheduled job names.
 */
export async function getScheduledJobs(): Promise<string[]> {
  const scheduledQueueNames: string[] = [];

  for (const [queueName, queue] of activeQueues) {
    const schedulers = await queue.getJobSchedulers();
    if (schedulers.length > 0) {
      scheduledQueueNames.push(queueName);
    }
  }

  return scheduledQueueNames;
}
