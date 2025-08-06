// @ts-nocheck

/**
 * Represents the client-facing interface for a queue.
 * Used to add new jobs and manage workers.
 * @template T The type of the data in the job payload.
 */
export interface Queue<T> {
  /**
   * The name of the queue.
   */
  name: string;

  /**
   * Adds a job to the queue.
   * @param data The payload for the job.
   * @param options Optional settings for this specific job.
   * @returns A promise that resolves to the unique ID of the job, or undefined if the job was not enqueued
   * e.g. if the job was throttled.
   */
  enqueue(data: T, options?: EnqueueOptions): Promise<string | undefined>;

  /**
   * Start the worker to process jobs from this queue.
   * @returns A promise that resolves when the worker is started.
   */
  work(): Promise<void>;
}

/**
 * Options that can be specified when adding a new job to the queue.
 */
export interface EnqueueOptions {
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
 * Defines the behavior and configuration of a queue worker.
 * @template T The type of the data in the job payload.
 */
export interface QueueDefinition<T> {
  /**
   * The function that will be called to process a job from the queue.
   * It should return a promise that resolves when the job is complete.
   * @param job The job object containing data and metadata.
   */
  handler: (job: QueueJob<T>) => unknown;

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
     * Default options to apply to all jobs in this queue.
     * These can be overridden by the options passed to `enqueue`.
     * Note: `delaySeconds` is not included as it's typically job-specific.
     */
    defaultJobOptions?: Omit<EnqueueOptions, 'delaySeconds'>;
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
