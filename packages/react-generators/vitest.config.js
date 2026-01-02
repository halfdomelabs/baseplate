import { createNodeVitestConfig } from '@baseplate-dev/tools/vitest-node';
import { mergeConfig } from 'vitest/config';

const baseConfig = createNodeVitestConfig(import.meta.dirname);

export default mergeConfig(baseConfig, {
  test: {
    setupFiles: ['@baseplate-dev/core-generators/test-helpers/setup'],
  },
});
