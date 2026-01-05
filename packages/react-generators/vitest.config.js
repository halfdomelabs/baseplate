import { createNodeVitestConfig } from '@baseplate-dev/tools/vitest-node';
import { mergeConfig } from 'vitest/config';

const baseConfig = createNodeVitestConfig(import.meta.dirname);

export default mergeConfig(baseConfig, {
  test: {
    setupFiles: ['./src/test-helpers/setup.test-helper.ts'],
  },
});
