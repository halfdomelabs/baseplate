import { packageInfoProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

export interface CoreFastifyGracefulShutdownPaths {
  gracefulShutdown: string;
}

const coreFastifyGracefulShutdownPaths =
  createProviderType<CoreFastifyGracefulShutdownPaths>(
    'core-fastify-graceful-shutdown-paths',
  );

const coreFastifyGracefulShutdownPathsTask = createGeneratorTask({
  dependencies: { packageInfo: packageInfoProvider },
  exports: {
    coreFastifyGracefulShutdownPaths: coreFastifyGracefulShutdownPaths.export(),
  },
  run({ packageInfo }) {
    const srcRoot = packageInfo.getPackageSrcPath();

    return {
      providers: {
        coreFastifyGracefulShutdownPaths: {
          gracefulShutdown: `${srcRoot}/plugins/graceful-shutdown.ts`,
        },
      },
    };
  },
});

export const CORE_FASTIFY_GRACEFUL_SHUTDOWN_PATHS = {
  provider: coreFastifyGracefulShutdownPaths,
  task: coreFastifyGracefulShutdownPathsTask,
};
