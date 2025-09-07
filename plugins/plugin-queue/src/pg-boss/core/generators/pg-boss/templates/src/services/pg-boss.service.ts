// @ts-nocheck

import type {
  EnqueueOptions,
  Queue,
  QueueDefinition,
  QueueJob,
  RepeatableConfig,
} from '%queuesImports';

import { config } from '%configServiceImports';
import { logError } from '%errorHandlerServiceImports';
import { logger } from '%loggerServiceImports';
import PgBoss from 'pg-boss';

/**
 * Global pg-boss instance.
 */
let pgBoss: PgBoss | undefined = undefined;

/**
 * Days to retain completed jobs.
 */
const DELETE_AFTER_DAYS = TPL_DELETE_AFTER_DAYS;

/**
 * Initialize the pg-boss instance.
 * @returns Promise that resolves when pg-boss is ready.
 */
export async function initializePgBoss({
  disableMaintenance = false,
  pollingIntervalSeconds = 2,
}: {
  disableMaintenance?: boolean;
  pollingIntervalSeconds?: number;
} = {}): Promise<void> {
  if (pgBoss) {
    return;
  }

  pgBoss = new PgBoss({
    connectionString: config.DATABASE_URL,
    pollingIntervalSeconds,
    deleteAfterDays: DELETE_AFTER_DAYS,
    // Disable maintenance in API mode
    ...(disableMaintenance && {
      supervise: false,
      schedule: false,
    }),
  });

  pgBoss.on('error', (error) => {
    logError(error, { source: 'pg-boss' });
  });

  await pgBoss.start();

  logger.info(
    {
      event: 'pg-boss-initialized',
      disableMaintenance,
    },
    'pg-boss initialized',
  );
}

/**
 * Shutdown the pg-boss instance.
 * @returns Promise that resolves when pg-boss is stopped.
 */
export async function shutdownPgBoss(): Promise<void> {
  if (pgBoss) {
    await pgBoss.stop();
    pgBoss = undefined;
  }
}

/**
 * Get the pg-boss instance, throwing if not initialized.
 * @returns The pg-boss instance.
 */
function getPgBoss(): PgBoss {
  if (!pgBoss) {
    throw new Error('pg-boss not initialized. Call initializePgBoss() first.');
  }
  return pgBoss;
}

/**
 * Convert our EnqueueOptions to pg-boss send options.
 * @param options The enqueue options from our interface.
 * @returns pg-boss send options.
 */
function mapEnqueueOptions(options?: EnqueueOptions): PgBoss.SendOptions {
  const pgBossOptions: PgBoss.SendOptions = {};

  if (options?.delaySeconds) {
    pgBossOptions.startAfter = new Date(
      Date.now() + options.delaySeconds * 1000,
    );
  }

  if (options?.priority !== undefined) {
    pgBossOptions.priority = options.priority;
  }

  if (options?.attempts !== undefined) {
    pgBossOptions.retryLimit = options.attempts - 1; // pg-boss counts retries, not total attempts
  }

  if (options?.backoff) {
    const { type, delaySeconds } = options.backoff;

    pgBossOptions.retryBackoff = type === 'exponential';
    pgBossOptions.retryDelay = delaySeconds;
  }

  return pgBossOptions;
}

/**
 * Convert pg-boss job to our QueueJob interface.
 * @param pgJob The pg-boss job object.
 * @returns Our QueueJob interface.
 */
function mapPgBossJob<T>(pgJob: PgBoss.JobWithMetadata<T>): QueueJob<T> {
  return {
    id: pgJob.id,
    name: pgJob.name,
    data: pgJob.data,
    // retryCount is 0 on first attempt, so add 1 to match our interface
    attemptNumber: pgJob.retryCount + 1,
  };
}

/**
 * Setup repeatable jobs for a queue.
 * @param queueName The name of the queue.
 * @param repeatable The repeatable configuration.
 */
async function setupRepeatableJobs(
  queueName: string,
  repeatable: RepeatableConfig | RepeatableConfig[],
): Promise<void> {
  const boss = getPgBoss();
  const configs = Array.isArray(repeatable) ? repeatable : [repeatable];

  for (const config of configs) {
    if (config.pattern) {
      await boss.schedule(queueName, config.pattern, {});
      logger.info(
        {
          queueName,
          pattern: config.pattern,
          event: 'repeatable-job-scheduled',
        },
        'Scheduled repeatable job',
      );
    }
  }
}

/**
 * Implementation of Queue interface backed by pg-boss.
 */
export class PgBossQueue<T> implements Queue<T> {
  private isWorkerStarted = false;
  private hasCreatedQueue = false;

  constructor(
    public readonly name: string,
    private readonly definition: QueueDefinition<T>,
  ) {}

  private async createQueue(): Promise<void> {
    if (this.hasCreatedQueue) {
      return;
    }

    const boss = getPgBoss();
    await boss.createQueue(this.name);
    this.hasCreatedQueue = true;
  }

  async enqueue(
    data: T,
    options?: EnqueueOptions,
  ): Promise<string | undefined> {
    await this.createQueue();

    const boss = getPgBoss();

    // Merge default job options with per-job options
    const mergedOptions: EnqueueOptions = {
      ...this.definition.options?.defaultJobOptions,
      ...options,
    };

    const pgBossOptions = mapEnqueueOptions(mergedOptions);
    const jobId = await boss.send(this.name, data as object, pgBossOptions);

    return jobId ?? undefined;
  }

  async work(): Promise<void> {
    if (this.isWorkerStarted) {
      logger.warn(
        { queueName: this.name, event: 'worker-already-started' },
        'Worker already started for queue',
      );
      return;
    }

    await this.createQueue();

    // Set up repeatable jobs if configured
    if (this.definition.repeatable) {
      await setupRepeatableJobs(this.name, this.definition.repeatable).catch(
        (err: unknown) => {
          logError(err, {
            source: 'pg-boss',
            event: 'repeatable-job-setup-failed',
          });
        },
      );
    }

    const boss = getPgBoss();

    // Set up the job worker
    await boss.work<T>(this.name, { includeMetadata: true }, async (jobs) => {
      // Process jobs in parallel, but handle errors individually
      const jobPromises = jobs.map(async (job) => {
        const queueJob = mapPgBossJob(job);

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

          await boss.complete(this.name, job.id, result as object);
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

          await boss.fail(this.name, job.id, { err: String(error) });
        }
      });

      // Wait for all jobs to complete (or fail) without short-circuiting
      await Promise.allSettled(jobPromises);
    });

    this.isWorkerStarted = true;

    logger.info(
      {
        queueName: this.name,
        hasRepeatable: !!this.definition.repeatable,
        event: 'queue-worker-started',
      },
      `Queue worker started`,
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
): PgBossQueue<T> {
  return new PgBossQueue(name, definition);
}

/**
 * Get all scheduled/cron jobs from pg-boss.
 * @returns Promise that resolves to array of scheduled job names.
 */
export async function getScheduledJobs(): Promise<string[]> {
  const boss = getPgBoss();
  const schedules = await boss.getSchedules();
  return [...new Set(schedules.map((s) => s.name))];
}

/**
 * Remove scheduled/cron jobs for queues that are no longer active.
 * @param activeQueueNames List of queue names that should have schedules.
 * @returns Promise that resolves when cleanup is complete.
 */
export async function cleanupOrphanedSchedules(
  activeQueueNames: string[],
): Promise<void> {
  const boss = getPgBoss();
  const existingSchedules = await getScheduledJobs();

  const orphanedQueues = existingSchedules.filter(
    (name) => !activeQueueNames.includes(name),
  );

  for (const queueName of orphanedQueues) {
    await boss.unschedule(queueName);
    logger.info(
      { queueName, event: 'orphaned-schedule-removed' },
      'Removed orphaned schedule for queue',
    );
  }
}
