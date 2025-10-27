import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { packageInfoProvider } from '#src/providers/project.js';

export interface NodeRootReadmePaths {
  readme: string;
}

const nodeRootReadmePaths = createProviderType<NodeRootReadmePaths>(
  'node-root-readme-paths',
);

const nodeRootReadmePathsTask = createGeneratorTask({
  dependencies: { packageInfo: packageInfoProvider },
  exports: { nodeRootReadmePaths: nodeRootReadmePaths.export() },
  run({ packageInfo }) {
    const packageRoot = packageInfo.getPackageRoot();

    return {
      providers: {
        nodeRootReadmePaths: { readme: `${packageRoot}/README.md` },
      },
    };
  },
});

export const NODE_ROOT_README_PATHS = {
  provider: nodeRootReadmePaths,
  task: nodeRootReadmePathsTask,
};
