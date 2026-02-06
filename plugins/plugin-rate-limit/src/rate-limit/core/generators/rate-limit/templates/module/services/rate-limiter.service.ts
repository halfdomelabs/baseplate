// @ts-nocheck

import type {
  RateLimiter,
  RateLimiterConfig,
  RateLimitResult,
} from '%rateLimitImports';

import { RateLimiterPrisma, RateLimiterRes } from 'rate-limiter-flexible';

import { TooManyRequestsError } from '%errorHandlerServiceImports';
import { prisma } from '%prismaImports';

/**
 * Convert rate-limiter-flexible response to our interface.
 */
function mapResult(res: RateLimiterRes, allowed: boolean): RateLimitResult {
  return {
    allowed,
    remainingPoints: Math.max(0, res.remainingPoints),
    msBeforeNext: res.msBeforeNext,
    consumedPoints: res.consumedPoints,
  };
}

/**
 * Create a rate limiter with the specified configuration.
 * Uses Prisma/PostgreSQL as the storage backend.
 *
 * @param name - Unique name for this rate limiter
 * @param limiterConfig - Configuration for the rate limiter
 * @returns A RateLimiter instance
 */
export function createRateLimiter(
  name: string,
  limiterConfig: RateLimiterConfig,
): RateLimiter {
  const keyPrefix = limiterConfig.keyPrefix ?? name;

  const primaryLimiter = new RateLimiterPrisma({
    storeClient: prisma,
    points: limiterConfig.points,
    duration: limiterConfig.duration,
    blockDuration: limiterConfig.blockDuration,
    keyPrefix,
  });

  return {
    async consume(key: string, points = 1): Promise<RateLimitResult> {
      try {
        const res = await primaryLimiter.consume(key, points);
        return mapResult(res, true);
      } catch (error) {
        if (error instanceof RateLimiterRes) {
          return mapResult(error, false);
        }
        throw error;
      }
    },

    async get(key: string): Promise<RateLimitResult | null> {
      const res = await primaryLimiter.get(key);
      if (!res) return null;
      return mapResult(res, res.remainingPoints >= 0);
    },

    async block(key: string, durationSeconds: number): Promise<void> {
      await primaryLimiter.block(key, durationSeconds);
    },

    async delete(key: string): Promise<void> {
      await primaryLimiter.delete(key);
    },

    async reward(key: string, points = 1): Promise<RateLimitResult> {
      const res = await primaryLimiter.reward(key, points);
      return mapResult(res, true);
    },

    async consumeOrThrow(
      key: string,
      errorMessage: string,
      errorCode: string,
      points = 1,
    ): Promise<void> {
      const result = await this.consume(key, points);
      if (!result.allowed) {
        throw new TooManyRequestsError(errorMessage, errorCode, {
          retryAfterMs: result.msBeforeNext,
        });
      }
    },
  };
}

/**
 * Create a memoized rate limiter getter function.
 * The rate limiter is lazily created on first call and cached for subsequent calls.
 *
 * @param name - Unique name for this rate limiter
 * @param config - Configuration for the rate limiter
 * @returns A function that returns the rate limiter
 */
export function memoizeRateLimiter(
  name: string,
  config: RateLimiterConfig,
): () => RateLimiter {
  let limiter: RateLimiter | undefined;
  return () => {
    limiter ??= createRateLimiter(name, config);
    return limiter;
  };
}
