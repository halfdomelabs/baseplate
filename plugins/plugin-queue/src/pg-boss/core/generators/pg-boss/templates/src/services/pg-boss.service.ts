// @ts-nocheck

import type {
  EnqueueOptions,
  QueueHandlerBinding,
  QueueInfo,
  QueueJob,
  QueueRuntime,
  QueueToken,
  RepeatableConfig,
  ScheduledJob,
} from '%queuesImports';
import type { ServiceContext } from '%serviceContextImports';

import { config } from '%configServiceImports';
import { logError } from '%errorHandlerServiceImports';
import { logger } from '%loggerServiceImports';
import PgBoss from 'pg-boss';

/**
 * Days to retain completed jobs.
 */
const DELETE_AFTER_DAYS = TPL_DELETE_AFTER_DAYS;

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
 * pg-boss deduplicates on `COALESCE(singleton_key, '')`, so jobs enqueued
 * without a key would all share the empty key and collide with each other,
 * silently limiting the queue to a single pending job.
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

function mapEnqueueOptions(options?: EnqueueOptions): PgBoss.SendOptions {
  const pgBossOptions: PgBoss.SendOptions = {};

  if (options?.singletonKey !== undefined) {
    pgBossOptions.singletonKey = options.singletonKey;
  }

  if (options?.delaySeconds) {
    pgBossOptions.startAfter = new Date(
      Date.now() + options.delaySeconds * 1000,
    );
  }

  if (options?.priority !== undefined) {
    pgBossOptions.priority = options.priority;
  }

  if (options?.attempts !== undefined) {
    // pg-boss counts retries, not total attempts
    pgBossOptions.retryLimit = options.attempts - 1;
  }

  if (options?.backoff) {
    const { type, delaySeconds } = options.backoff;

    pgBossOptions.retryBackoff = type === 'exponential';
    pgBossOptions.retryDelay = delaySeconds;
  }

  return pgBossOptions;
}

function mapPgBossJob<T>(pgJob: PgBoss.JobWithMetadata<T>): QueueJob<T> {
  return {
    id: pgJob.id,
    name: pgJob.name,
    data: pgJob.data,
    // retryCount is 0 on first attempt, so add 1 to match our interface
    attemptNumber: pgJob.retryCount + 1,
  };
}

async function setupRepeatableJobs(
  boss: PgBoss,
  queueName: string,
  repeatable: RepeatableConfig | RepeatableConfig[],
): Promise<void> {
  const configs = Array.isArray(repeatable) ? repeatable : [repeatable];

  for (const jobConfig of configs) {
    if (jobConfig.pattern) {
      await boss.schedule(queueName, jobConfig.pattern, {});
      logger.info(
        {
          queueName,
          pattern: jobConfig.pattern,
          event: 'repeatable-job-scheduled',
        },
        'Scheduled repeatable job',
      );
    }
  }
}

/**
 * Constructs a {@link QueueRuntime} backed by pg-boss from a list of handler
 * bindings collected from the app module tree.
 *
 * Passively allocates: the pg-boss client is constructed but not started
 * here, so construction performs no I/O. `boss.start()` runs lazily on first
 * use (enqueue or worker startup).
 *
 * @param bindings Every queue handler binding registered across app modules.
 * @param options.disableMaintenance Disables pg-boss's own maintenance/schedule
 * loops. Set this in every process except one, when running pg-boss across
 * multiple processes (e.g. API + standalone worker), so only one process
 * performs maintenance.
 * @returns A {@link QueueRuntime} for enqueueing jobs and running workers.
 * @throws If two bindings share the same token name.
 */
export function createQueueRuntime(
  bindings: QueueHandlerBinding[],
  options: { disableMaintenance?: boolean } = {},
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

  const boss = new PgBoss({
    connectionString: config.DATABASE_URL,
    ...(options.disableMaintenance && {
      supervise: false,
      schedule: false,
    }),
  });
  boss.on('error', (error: Error) => {
    logError(error, { source: 'pg-boss' });
  });

  let startPromise: Promise<void> | undefined;
  const createdQueues = new Set<string>();
  const workingQueues = new Set<string>();

  function ensureStarted(): Promise<void> {
    startPromise ??= boss.start().then(() => undefined);
    return startPromise;
  }

  async function ensureQueueCreated(
    binding: QueueHandlerBinding,
  ): Promise<void> {
    const { name } = binding.token;
    if (createdQueues.has(name)) {
      return;
    }
    await ensureStarted();
    await boss.createQueue(name, {
      deleteAfterSeconds: DELETE_AFTER_DAYS * 24 * 60 * 60,
      // pg-boss only deduplicates by singletonKey when the queue uses a
      // policy that enforces it; the default `standard` policy ignores
      // singletonKey entirely. The policy is fixed at creation time.
      ...(binding.options?.deduplication && { policy: 'exclusive' }),
    });
    createdQueues.add(name);
  }

  async function enqueue<T>(
    token: QueueToken<T>,
    data: T,
    enqueueOptions?: EnqueueOptions,
  ): Promise<string | undefined> {
    const binding = bindingsByName.get(token.name);
    if (!binding) {
      throw new Error(
        `No handler bound for queue "${token.name}". Bind one with bindQueueHandler().`,
      );
    }

    await ensureQueueCreated(binding);

    const mergedOptions: EnqueueOptions = {
      ...binding.options?.defaultJobOptions,
      ...enqueueOptions,
    };

    assertSingletonKeyIfDeduplicated(
      token.name,
      binding,
      mergedOptions.singletonKey,
    );

    const pgBossOptions = mapEnqueueOptions(mergedOptions);
    // Returns null when a job with the same singletonKey is already pending
    // or active on a deduplicated queue, i.e. the job was intentionally
    // dropped.
    const jobId = await boss.send(token.name, data as object, pgBossOptions);

    return jobId ?? undefined;
  }

  async function cleanupOrphanedSchedules(
    activeQueueNames: string[],
  ): Promise<void> {
    const schedules = await boss.getSchedules();
    const orphanedQueues = schedules
      .map((schedule) => schedule.name)
      .filter((name) => !activeQueueNames.includes(name));

    for (const queueName of orphanedQueues) {
      await boss.unschedule(queueName);
      logger.info(
        { queueName, event: 'orphaned-schedule-removed' },
        'Removed orphaned schedule for queue',
      );
    }
  }

  async function startWorkers(workerOptions: {
    createContext: () => ServiceContext;
  }): Promise<void> {
    await ensureStarted();

    const activeQueueNames = bindings.map((binding) => binding.token.name);
    await cleanupOrphanedSchedules(activeQueueNames);

    const startedQueueNames: string[] = [];

    async function startOne(binding: QueueHandlerBinding): Promise<void> {
      const { name } = binding.token;

      // Resolve any lazyHandler now, so a broken dynamic import fails
      // startup instead of surfacing as a job failure/retry later.
      await binding.resolve();

      await ensureQueueCreated(binding);

      if (binding.repeatable) {
        await setupRepeatableJobs(boss, name, binding.repeatable);
      }

      await boss.work(
        name,
        { includeMetadata: true },
        async (jobs: PgBoss.JobWithMetadata[]) => {
          const jobPromises = jobs.map(async (job) => {
            // A fresh context per job: execution-scoped caches (auth,
            // authorizer model lookups) must not leak across unrelated jobs.
            const ctx = workerOptions.createContext();
            const queueJob = mapPgBossJob(job);

            logger.info(
              {
                queueName: name,
                jobId: job.id,
                attemptNumber: queueJob.attemptNumber,
                event: 'job-processing-started',
              },
              `Processing job ${job.id} for queue ${name} (attempt ${queueJob.attemptNumber})`,
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
                `Job ${job.id} for queue ${name} completed successfully`,
              );

              await boss.complete(name, job.id, result as object);
            } catch (error: unknown) {
              logError(error, {
                queueName: name,
                jobId: job.id,
                attemptNumber: queueJob.attemptNumber,
                event: 'job-processing-failed',
              });

              await boss.fail(name, job.id, { err: String(error) });
            }
          });

          await Promise.all(jobPromises);
        },
      );

      workingQueues.add(name);
      startedQueueNames.push(name);

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
      await Promise.all(startedQueueNames.map((name) => boss.offWork(name)));
      for (const name of startedQueueNames) {
        workingQueues.delete(name);
      }
      throw error;
    }
  }

  /**
   * Stops all running workers, then the pg-boss client, always attempting
   * both stages even if the first fails. Aggregates every failure instead of
   * surfacing only the first.
   */
  async function stopWorkers(): Promise<void> {
    const errors: unknown[] = [];

    const workerErrors = await collectRejections(
      [...workingQueues].map((name) => boss.offWork(name)),
    );
    errors.push(...workerErrors);
    workingQueues.clear();

    if (startPromise) {
      startPromise = undefined;
      const stopErrors = await collectRejections([boss.stop()]);
      errors.push(...stopErrors);
    }

    if (errors.length > 0) {
      throw new AggregateError(errors, 'Failed to stop queue workers');
    }
  }

  function listQueues(): QueueInfo[] {
    return bindings.map((binding) => ({ name: binding.token.name }));
  }

  async function getScheduledJobs(): Promise<ScheduledJob[]> {
    await ensureStarted();
    const schedules = await boss.getSchedules();
    return [...new Set(schedules.map((schedule) => schedule.name))].map(
      (name) => ({ name }),
    );
  }

  return {
    enqueue,
    startWorkers,
    stopWorkers,
    listQueues,
    getScheduledJobs,
  };
}
