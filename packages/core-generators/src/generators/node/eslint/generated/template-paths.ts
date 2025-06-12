import { createProviderType } from '@baseplate-dev/sync';

export interface NodeEslintPaths {
  eslintConfig: string;
}

const nodeEslintPaths =
  createProviderType<NodeEslintPaths>('node-eslint-paths');

export const NODE_ESLINT_PATHS = {
  provider: nodeEslintPaths,
};
