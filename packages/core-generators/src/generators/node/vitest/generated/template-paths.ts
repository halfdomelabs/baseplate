import { createProviderType } from '@baseplate-dev/sync';

export interface NodeVitestPaths {
  globalSetup: string;
  vitestConfig: string;
}

const nodeVitestPaths =
  createProviderType<NodeVitestPaths>('node-vitest-paths');

export const NODE_VITEST_PATHS = {
  provider: nodeVitestPaths,
};
