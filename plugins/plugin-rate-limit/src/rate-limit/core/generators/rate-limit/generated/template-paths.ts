import { packageInfoProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

export interface RateLimitCoreRateLimitPaths {
  rateLimiterService: string;
  rateLimiterTypes: string;
}

const rateLimitCoreRateLimitPaths =
  createProviderType<RateLimitCoreRateLimitPaths>(
    'rate-limit-core-rate-limit-paths',
  );

const rateLimitCoreRateLimitPathsTask = createGeneratorTask({
  dependencies: { packageInfo: packageInfoProvider },
  exports: {
    rateLimitCoreRateLimitPaths: rateLimitCoreRateLimitPaths.export(),
  },
  run({ packageInfo }) {
    const srcRoot = packageInfo.getPackageSrcPath();

    return {
      providers: {
        rateLimitCoreRateLimitPaths: {
          rateLimiterService: `${srcRoot}/services/rate-limiter.service.ts`,
          rateLimiterTypes: `${srcRoot}/types/rate-limiter.types.ts`,
        },
      },
    };
  },
});

export const RATE_LIMIT_CORE_RATE_LIMIT_PATHS = {
  provider: rateLimitCoreRateLimitPaths,
  task: rateLimitCoreRateLimitPathsTask,
};
