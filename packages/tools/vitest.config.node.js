// @ts-check

import { defaultExclude, defineConfig } from 'vitest/config';

import { srcSubpathImportPlugin } from './src-subpath-import-plugin.js';

/**
 * Create a vitest config for a Node.js project
 *
 * @param {string} dirname - The directory name of the project
 * @returns {import('vitest/config').ViteUserConfig} - The vitest config
 */
export function createNodeVitestConfig(dirname) {
  return defineConfig({
    plugins: [srcSubpathImportPlugin(dirname)],
    test: {
      watch: false,
      server: {
        deps: {
          inline: ['globby'],
        },
      },
      mockReset: true,
      dir: 'src',
      exclude: [
        ...defaultExclude,
        '**/dist/**',
        // Any depth: generator directories nest differently across packages,
        // and template sources are never runnable — their imports are
        // placeholders resolved at render time.
        '**/generators/**/templates/**',
      ],
    },
  });
}
