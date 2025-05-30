// @ts-check

import { defineConfig } from 'vitest/config';

import { srcSubpathImportPlugin } from './src-subpath-import-plugin.js';

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
