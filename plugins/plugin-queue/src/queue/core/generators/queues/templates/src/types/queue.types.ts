// @ts-nocheck

import type {
  ServiceContext,
  ServiceContextWith,
} from '%serviceContextImports';

/**
 * An inert reference to a queue, carrying only its name and payload type.
 * Produced by {@link defineQueue}. Importing a token pulls in no handler or
 * adapter code - it is the leaf of the import graph, safe for enqueue-side
 * code to depend on without dragging in worker-only dependencies.
 * @template T The type of the data in the job payload.
 */
export interface QueueToken<T> {
  /**
   * The name of the queue.
   */
  readonly name: string;
  /**
   * Phantom field carrying the payload type; never assigned a value.
   */
  readonly __type?: T;
}

/**
 * Declares a queue token. The returned token has no handler attached - bind
 * one separately with {@link bindQueueHandler} in a different file so
 * enqueue-side code never transitively imports handler dependencies.
 * @param name The name of the queue.
 * @returns An inert {@link QueueToken} for the queue.
 */
export function defineQueue<T>(name: string): QueueToken<T> {
  return { name };
}

/**
 * Configuration shared by both binding forms (inline handler and lazy handler).
 * @template T The type of the data in the job payload.
 */
export interface QueueHandlerBindingConfig<T> {
  /**
   * The token this binding processes jobs for.
   */
  token: QueueToken<T>;

  /**
   * Configuration for creating repeatable jobs on a schedule.
   * Can be a single config object or an array for multiple schedules.
   */
  repeatable?: RepeatableConfig | RepeatableConfig[];

  /**
   * Advanced options for the queue's behavior.
   */
  options?: {
    /**
     * Deduplicate jobs in this queue by `singletonKey`, which every enqueue must
     * then supply. See `EnqueueOptions.singletonKey`.
     *
     * Must be set before the queue is first created: pg-boss fixes a queue's
     * deduplication behavior at creation time, so enabling this on an
     * already-deployed queue has no effect until that queue is recreated.
     */
    deduplication?: boolean;

    /**
     * Default options to apply to all jobs in this queue.
     * These can be overridden by the options passed to `enqueue`.
     * Note: `delaySeconds` is not included as it's typically job-specific, and
     * `singletonKey` is not included as a deduplication key is inherently
     * per-job — sharing one across every job would collapse the queue to a
     * single job at a time.
     */
    defaultJobOptions?: Omit<EnqueueOptions, 'delaySeconds' | 'singletonKey'>;
  };
}

/**
 * A handler function bound to a queue, receiving each job and the worker's
 * service context.
 * @template T The type of the data in the job payload.
 */
export type QueueJobHandler<T> = (
  job: QueueJob<T>,
  ctx: ServiceContextWith<never>,
) => unknown;

/**
 * The configuration accepted by {@link bindQueueHandler}: a handler or
 * lazyHandler (exactly one), plus the shared binding options.
 * @template T The type of the data in the job payload.
 */
export type QueueHandlerBindingInput<T> =
  | (Omit<QueueHandlerBindingConfig<T>, 'token'> & {
      handler: QueueJobHandler<T>;
      lazyHandler?: never;
    })
  | (Omit<QueueHandlerBindingConfig<T>, 'token'> & {
      handler?: never;
      lazyHandler: () => Promise<{ handler: QueueJobHandler<T> }>;
    });

/**
 * A handler bound to a {@link QueueToken}, produced by {@link bindQueueHandler}.
 *
 * The payload type is erased here, at the single point a binding is produced:
 * {@link bindQueueHandler} type-checks the token/handler pairing against `T`,
 * then returns this erased shape so heterogeneous bindings can share one
 * `AppModule.queues` array. Erasure never leaks back out to callers - the
 * public surface is {@link bindQueueHandler}'s generic signature, not this type.
 */
export interface QueueHandlerBinding extends Omit<
  QueueHandlerBindingConfig<unknown>,
  'token'
> {
  readonly token: QueueToken<unknown>;
  /**
   * Resolves a `lazyHandler`, if configured, and caches it so `invoke` never
   * triggers the dynamic import. Call once per binding before starting
   * workers, so a broken lazy import fails startup rather than surfacing as
   * a job failure/retry once traffic arrives. A no-op for inline handlers.
   */
  resolve(): Promise<void>;
  invoke(job: QueueJob<unknown>, ctx: ServiceContext): Promise<unknown>;
}

/**
 * Binds a handler to a {@link QueueToken}. Place this call in a file separate
 * from the token definition and from any enqueue-side code, so importing the
 * token never pulls in the handler's dependencies.
 * @param token The token to bind a handler to.
 * @param config The binding configuration (handler or lazyHandler, plus options).
 * @returns The erased {@link QueueHandlerBinding} to register on an `AppModule`.
 */
export function bindQueueHandler<T>(
  token: QueueToken<T>,
  config: QueueHandlerBindingInput<T>,
): QueueHandlerBinding {
  let resolvedHandler = config.handler;

  async function ensureHandler(): Promise<QueueJobHandler<T>> {
    if (resolvedHandler) {
      return resolvedHandler;
    }
    if (!config.lazyHandler) {
      throw new Error(
        `Queue binding for "${token.name}" has neither a handler nor a lazyHandler.`,
      );
    }
    const { handler } = await config.lazyHandler();
    resolvedHandler = handler;
    return handler;
  }

  return {
    token,
    repeatable: config.repeatable,
    options: config.options,
    async resolve(): Promise<void> {
      await ensureHandler();
    },
    async invoke(job, ctx): Promise<unknown> {
      const handler = await ensureHandler();
      return handler(job as QueueJob<T>, ctx);
    },
  };
}

/**
 * Options that can be specified when adding a new job to the queue.
 */
export interface EnqueueOptions {
  /**
   * Deduplication key, making enqueueing idempotent when a caller may retry.
   * While a job with this key is pending or active, further enqueues with the
   * same key are dropped; the key is released once the job completes or fails.
   *
   * Requires `deduplication: true` on the queue, which then requires a key on
   * every enqueue. The return value of `enqueue` cannot be used to detect a
   * dropped job, as it differs by backend.
   */
  singletonKey?: string;
  /**
   * The amount of time in seconds to delay before the job can be processed.
   */
  delaySeconds?: number;
  /**
   * The priority of the job. Lower numbers have higher priority.
   */
  priority?: number;
  /**
   * The total number of attempts to try the job if it fails.
   */
  attempts?: number;
  /**
   * Backoff configuration for retry attempts.
   */
  backoff?: {
    /**
     * The backoff strategy to use for retries.
     */
    type: 'exponential' | 'fixed';
    /**
     * The initial delay in seconds between retry attempts.
     */
    delaySeconds: number;
    /**
     * The maximum delay in seconds for exponential backoff (optional).
     * Note: pg-boss does not support max delay for exponential backoff.
     * This field is included for future compatibility but is not currently implemented.
     */
    maxDelaySeconds?: number;
  };
}

/**
 * Represents a job object that is passed to the handler function.
 * @template T The type of the data in the job payload.
 */
export interface QueueJob<T> {
  /**
   * The unique identifier for the job.
   */
  id: string;
  /**
   * The name of the queue this job belongs to.
   */
  name: string;
  /**
   * The data payload of the job.
   */
  data: T;
  /**
   * The current attempt number for this job (starts at 1).
   */
  attemptNumber: number;
}

/**
 * Configuration for a repeatable job.
 */
export interface RepeatableConfig {
  /**
   * A cron pattern specifying when the job should repeat.
   */
  pattern?: string;
}

/**
 * Information about a registered queue.
 */
export interface QueueInfo {
  /**
   * The name of the queue.
   */
  name: string;
}

/**
 * A scheduled/repeatable job registered on a queue.
 */
export interface ScheduledJob {
  /**
   * The name of the queue the schedule belongs to.
   */
  name: string;
}

/**
 * The full runtime surface for queues: enqueueing jobs, running workers, and
 * introspecting registered queues.
 */
export interface QueueRuntime {
  /**
   * Enqueues a job for the given token.
   * @param token The queue token to enqueue a job for.
   * @param data The job payload.
   * @param options Optional per-job settings.
   * @returns The job ID, or undefined if the job was not enqueued (e.g. deduplicated).
   * @throws If no handler is bound for the token.
   */
  enqueue<T>(
    token: QueueToken<T>,
    data: T,
    options?: EnqueueOptions,
  ): Promise<string | undefined>;

  /**
   * Starts workers for every bound queue.
   * @param options Provides the service context each job handler runs with.
   */
  startWorkers(options: { createContext: () => ServiceContext }): Promise<void>;

  /**
   * Stops all running workers.
   */
  stopWorkers(): Promise<void>;

  /**
   * Lists all queues with a bound handler.
   */
  listQueues(): QueueInfo[];

  /**
   * Gets all scheduled/repeatable jobs.
   */
  getScheduledJobs(): Promise<ScheduledJob[]>;
}

/**
 * The producer-only view of {@link QueueRuntime}, for code that only enqueues jobs.
 */
export type QueueService = Pick<QueueRuntime, 'enqueue'>;

/**
 * The worker-lifecycle view of {@link QueueRuntime}, for worker entrypoints and
 * embedded-workers plugins.
 */
export type QueueWorkers = Pick<QueueRuntime, 'startWorkers' | 'stopWorkers'>;

/**
 * The introspection view of {@link QueueRuntime}, for dashboards/diagnostics.
 */
export type QueueIntrospection = Pick<
  QueueRuntime,
  'listQueues' | 'getScheduledJobs'
>;
