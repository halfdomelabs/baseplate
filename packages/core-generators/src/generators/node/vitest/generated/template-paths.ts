import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { packageInfoProvider } from '#src/providers/project.js';

export interface NodeVitestPaths {
  loggerTestHelper: string;
  vitestConfig: string;
}

const nodeVitestPaths =
  createProviderType<NodeVitestPaths>('node-vitest-paths');

const nodeVitestPathsTask = createGeneratorTask({
  dependencies: { packageInfo: packageInfoProvider },
  exports: { nodeVitestPaths: nodeVitestPaths.export() },
  run({ packageInfo }) {
    const packageRoot = packageInfo.getPackageRoot();
    const srcRoot = packageInfo.getPackageSrcPath();

    return {
      providers: {
        nodeVitestPaths: {
          loggerTestHelper: `${srcRoot}/tests/helpers/logger.test-helper.ts`,
          vitestConfig: `${packageRoot}/vitest.config.ts`,
        },
      },
    };
  },
});

export const NODE_VITEST_PATHS = {
  provider: nodeVitestPaths,
  task: nodeVitestPathsTask,
};
