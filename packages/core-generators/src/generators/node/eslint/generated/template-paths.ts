import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { packageInfoProvider } from '#src/providers/project.js';

export interface NodeEslintPaths {
  eslintConfig: string;
}

const nodeEslintPaths =
  createProviderType<NodeEslintPaths>('node-eslint-paths');

const nodeEslintPathsTask = createGeneratorTask({
  dependencies: { packageInfo: packageInfoProvider },
  exports: { nodeEslintPaths: nodeEslintPaths.export() },
  run({ packageInfo }) {
    const packageRoot = packageInfo.getPackageRoot();

    return {
      providers: {
        nodeEslintPaths: { eslintConfig: `${packageRoot}/eslint.config.mjs` },
      },
    };
  },
});

export const NODE_ESLINT_PATHS = {
  provider: nodeEslintPaths,
  task: nodeEslintPathsTask,
};
