// @ts-check

import fs from 'node:fs';
import path from 'node:path';

const EXTENSIONS = [
  '.ts',
  '.cts',
  '.mts',
  '.tsx',
  '.jsx',
  '.js',
  '.cjs',
  '.mjs',
];

/**
 * Create a custom resolve hook that only resolves #src imports from project files
 *
 * It mimics Typescript behavior of replacing ./dist with ./src:
 * https://www.typescriptlang.org/docs/handbook/modules/reference.html#example-local-project-with-conditions
 *
 * @param {string} dirname - The project directory
 * @returns {import('vite').Plugin} - The custom resolve hook
 */
export function srcSubpathImportPlugin(dirname) {
  const srcPath = path.resolve(dirname, './src');

  return {
    name: 'custom-src-resolve',
    resolveId: {
      order: 'pre',
      handler(id, importer) {
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
        const basePath = id.replace(/^#src/, srcPath).replace(/\.js$/, '');

        // Try each extension
        for (const ext of EXTENSIONS) {
          const resolvedPath = basePath + ext;
          if (fs.existsSync(resolvedPath)) {
            return resolvedPath;
          }
        }

        // If no extension matches, return the base path
        return basePath;
      },
    },
  };
}
