// @ts-check

import path from 'node:path';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    watch: false,
    root: './src',
    server: {
      deps: {
        inline: ['globby'],
      },
    },
    mockReset: true,
    alias: {
      '#src': './src',
    },
  },
});

/**
 * Create a vitest config for a node project
 *
 * @param {string} dirname - The directory name of the project
 * @returns {import('vitest/config').UserConfig} - The vitest config
 */
export function createNodeVitestConfig(dirname) {
  return defineConfig({
    plugins: [tsconfigPaths()],
    test: {
      watch: false,
      root: './src',
      server: {
        deps: {
          inline: ['globby'],
        },
      },
      mockReset: true,
      alias: {
        '#src': path.resolve(dirname, './src'),
      },
    },
  });
}
