import path from 'node:path';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

/**

// NOTE: This requires the following setup file to be present in the root of the project.

import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

afterEach(() => {
  cleanup();
});

 */

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    watch: false,
    root: './src',
    mockReset: true,
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.ts'],
  },
});

/**
 * Create a vitest config for a React project
 *
 * @param {string} dirname - The directory name of the project
 * @returns {import('vitest/config').UserConfig} - The vitest config
 */
export function createReactVitestConfig(dirname) {
  return defineConfig({
    test: {
      watch: false,
      root: './src',
      mockReset: true,
      environment: 'jsdom',
      setupFiles: ['./src/tests/setup.ts'],
      alias: {
        '#src': path.resolve(dirname, './src'),
      },
    },
  });
}
