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
 * Create a custom resolve hook that only resolves #src imports from project files
 *
 * It attempts to mimic Typescript behavior of replacing ./dist with ./src:
 * https://www.typescriptlang.org/docs/handbook/modules/reference.html#example-local-project-with-conditions
 *
 * @param {string} dirname - The project directory
 * @returns {import('vite').Plugin} - The custom resolve hook
 */
function createSrcResolveHook(dirname) {
  const srcPath = path.resolve(dirname, './src');

  return {
    name: 'custom-src-resolve',
    resolveId(id, importer) {
      // Only handle #src imports
      if (!id.startsWith('#src')) {
        return null;
      }

      // Skip if no importer (entry point) or importer is in node_modules
      if (!importer || importer.includes('node_modules')) {
        return null;
      }

      // Check if importer is within the project directory
      const resolvedImporter = path.resolve(importer);
      const projectRoot = path.resolve(dirname);

      if (!resolvedImporter.startsWith(projectRoot)) {
        return null;
      }

      // Replace #src with the actual src path
      const resolvedPath = id.replace(/^#src/, srcPath);

      return resolvedPath;
    },
  };
}

/**
 * Create a vitest config for a Node.js project
 *
 * @param {string} dirname - The directory name of the project
 * @returns {import('vitest/config').UserConfig} - The vitest config
 */
export function createNodeVitestConfig(dirname) {
  return defineConfig({
    plugins: [createSrcResolveHook(dirname)],
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
