// @ts-check

import { defineConfig } from 'vitest/config';

import { srcSubpathImportPlugin } from './src-subpath-import-plugin.js';

/**

// NOTE: This requires the following setup file to be present in the root of the project.

import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

afterEach(() => {
  cleanup();
});

 */

/**
 * Create a vitest config for a React project
 *
 * @param {string} dirname - The directory name of the project
 * @returns {import('vitest/config').UserConfig} - The vitest config
 */
export function createReactVitestConfig(dirname) {
  return defineConfig({
    plugins: [srcSubpathImportPlugin(dirname)],
    test: {
      watch: false,
      mockReset: true,
      environment: 'jsdom',
      setupFiles: ['./src/tests/setup.ts'],
    },
  });
}
