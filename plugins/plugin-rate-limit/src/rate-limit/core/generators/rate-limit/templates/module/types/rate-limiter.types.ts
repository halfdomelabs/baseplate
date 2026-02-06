// @ts-nocheck

/**
 * Configuration for creating a rate limiter instance.
 */
export interface RateLimiterConfig {
  /**
   * Maximum number of points allowed within the duration window.
   */
  points: number;

  /**
   * Duration window in seconds.
   */
  duration: number;

  /**
   * Duration in seconds to block the key after the limit is exceeded.
   * If set, the key will be blocked for this duration when points are exhausted.
   */
  blockDuration?: number;

  /**
   * Prefix for storage keys to namespace different limiters.
   */
  keyPrefix?: string;
}

/**
 * Result from a rate limit check operation.
 */
export interface RateLimitResult {
  /**
   * Whether the request is allowed (not rate limited).
   */
  allowed: boolean;

  /**
   * Remaining points in the current window.
   */
  remainingPoints: number;

  /**
   * Time in milliseconds until the limit resets.
   */
  msBeforeNext: number;

  /**
   * Total points consumed in the current window.
   */
  consumedPoints: number;
}

/**
 * Rate limiter instance interface.
 * Provides methods for checking and managing rate limits.
 */
export interface RateLimiter {
  /**
   * Consume points for a key.
   * Returns a result with allowed status - does NOT throw on rate limit.
   *
   * @param key - The key to rate limit (e.g., IP address, user ID)
   * @param points - Number of points to consume (default: 1)
   * @returns Result indicating if the request is allowed
   */
  consume(key: string, points?: number): Promise<RateLimitResult>;

  /**
   * Get the current rate limit state for a key without consuming points.
   *
   * @param key - The key to check
   * @returns Current state or null if key has no history
   */
  get(key: string): Promise<RateLimitResult | null>;

  /**
   * Block a key for a specified duration.
   *
   * @param key - The key to block
   * @param durationSeconds - Duration to block in seconds
   */
  block(key: string, durationSeconds: number): Promise<void>;

  /**
   * Delete/reset a key's rate limit state.
   *
   * @param key - The key to reset
   */
  delete(key: string): Promise<void>;

  /**
   * Reward points back to a key (e.g., on successful action).
   *
   * @param key - The key to reward
   * @param points - Number of points to reward (default: 1)
   * @returns Updated state after reward
   */
  reward(key: string, points?: number): Promise<RateLimitResult>;

  /**
   * Consume points for a key, throwing TooManyRequestsError if rate limited.
   *
   * @param key - The key to rate limit (e.g., IP address, user ID)
   * @param errorMessage - Error message to include in the thrown error
   * @param errorCode - Error code to include in the thrown error
   * @param points - Number of points to consume (default: 1)
   * @throws TooManyRequestsError if rate limited
   */
  consumeOrThrow(
    key: string,
    errorMessage: string,
    errorCode: string,
    points?: number,
  ): Promise<void>;
}
