import { packageInfoProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

export interface CoreFastifyServerPaths {
  index: string;
  server: string;
}

const coreFastifyServerPaths = createProviderType<CoreFastifyServerPaths>(
  'core-fastify-server-paths',
);

const coreFastifyServerPathsTask = createGeneratorTask({
  dependencies: { packageInfo: packageInfoProvider },
  exports: { coreFastifyServerPaths: coreFastifyServerPaths.export() },
  run({ packageInfo }) {
    const srcRoot = packageInfo.getPackageSrcPath();

    return {
      providers: {
        coreFastifyServerPaths: {
          index: `${srcRoot}/index.ts`,
          server: `${srcRoot}/server.ts`,
        },
      },
    };
  },
});

export const CORE_FASTIFY_SERVER_PATHS = {
  provider: coreFastifyServerPaths,
  task: coreFastifyServerPathsTask,
};
