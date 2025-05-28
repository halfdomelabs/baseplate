// @ts-check

import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

import { srcSubpathImportPlugin } from './src-subpath-import-plugin.js';

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
 * Create a vitest config for a Node.js project
 *
 * @param {string} dirname - The directory name of the project
 * @returns {import('vitest/config').UserConfig} - The vitest config
 */
export function createNodeVitestConfig(dirname) {
  return defineConfig({
    plugins: [srcSubpathImportPlugin(dirname)],
    test: {
      watch: false,
      root: './src',
      server: {
        deps: {
          inline: ['globby'],
        },
      },
      mockReset: true,
    },
  });
}
