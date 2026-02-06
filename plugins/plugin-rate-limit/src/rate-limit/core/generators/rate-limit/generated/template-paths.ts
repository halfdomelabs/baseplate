import { appModuleProvider } from '@baseplate-dev/fastify-generators';
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
  dependencies: { appModule: appModuleProvider },
  exports: {
    rateLimitCoreRateLimitPaths: rateLimitCoreRateLimitPaths.export(),
  },
  run({ appModule }) {
    const moduleRoot = appModule.getModuleFolder();

    return {
      providers: {
        rateLimitCoreRateLimitPaths: {
          rateLimiterService: `${moduleRoot}/services/rate-limiter.service.ts`,
          rateLimiterTypes: `${moduleRoot}/types/rate-limiter.types.ts`,
        },
      },
    };
  },
});

export const RATE_LIMIT_CORE_RATE_LIMIT_PATHS = {
  provider: rateLimitCoreRateLimitPaths,
  task: rateLimitCoreRateLimitPathsTask,
};
