import { packageInfoProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

export interface CoreFastifyHealthCheckPaths {
  healthCheck: string;
}

const coreFastifyHealthCheckPaths =
  createProviderType<CoreFastifyHealthCheckPaths>(
    'core-fastify-health-check-paths',
  );

const coreFastifyHealthCheckPathsTask = createGeneratorTask({
  dependencies: { packageInfo: packageInfoProvider },
  exports: {
    coreFastifyHealthCheckPaths: coreFastifyHealthCheckPaths.export(),
  },
  run({ packageInfo }) {
    const srcRoot = packageInfo.getPackageSrcPath();

    return {
      providers: {
        coreFastifyHealthCheckPaths: {
          healthCheck: `${srcRoot}/plugins/health-check.ts`,
        },
      },
    };
  },
});

export const CORE_FASTIFY_HEALTH_CHECK_PATHS = {
  provider: coreFastifyHealthCheckPaths,
  task: coreFastifyHealthCheckPathsTask,
};
