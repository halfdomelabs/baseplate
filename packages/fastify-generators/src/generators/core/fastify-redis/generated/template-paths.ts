import { packageInfoProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

export interface CoreFastifyRedisPaths {
  globalSetupRedis: string;
  redis: string;
}

const coreFastifyRedisPaths = createProviderType<CoreFastifyRedisPaths>(
  'core-fastify-redis-paths',
);

const coreFastifyRedisPathsTask = createGeneratorTask({
  dependencies: { packageInfo: packageInfoProvider },
  exports: { coreFastifyRedisPaths: coreFastifyRedisPaths.export() },
  run({ packageInfo }) {
    const srcRoot = packageInfo.getPackageSrcPath();

    return {
      providers: {
        coreFastifyRedisPaths: {
          globalSetupRedis: `${srcRoot}/tests/scripts/global-setup-redis.ts`,
          redis: `${srcRoot}/services/redis.ts`,
        },
      },
    };
  },
});

export const CORE_FASTIFY_REDIS_PATHS = {
  provider: coreFastifyRedisPaths,
  task: coreFastifyRedisPathsTask,
};
