// @ts-check

import { defineConfig } from 'eslint/config';
import path from 'node:path';

import { prettierEslintConfig } from './eslint-configs/prettier.js';
import { generateReactEslintConfig } from './eslint-configs/react.js';
import {
  storybookEslintConfig,
  storybookTypescriptExtraDevDependencies,
} from './eslint-configs/storybook.js';
import { generateTypescriptEslintConfig } from './eslint-configs/typescript.js';

/**
 * @typedef {Object} DefineReactEslintConfigOptions
 * @property {string} dirname - The import.meta.dirname of the calling package
 * @property {boolean} [includeStorybook=false] - Whether to include Storybook configuration
 * @property {string | null} [tailwindEntryPoint='src/styles.css'] - Path to Tailwind CSS entry file relative to dirname. Pass null to disable Tailwind linting.
 * @property {string[]} [ignores] - Additional ignore patterns
 */

/**
 * Defines a React ESLint configuration for a package
 * @param {DefineReactEslintConfigOptions} options - Configuration options
 */
export function defineReactEslintConfig(options) {
  const {
    dirname,
    includeStorybook = false,
    tailwindEntryPoint = 'src/styles.css',
    ignores = [],
  } = options;

  const absoluteTailwindPath =
    tailwindEntryPoint === null ? null : path.join(dirname, tailwindEntryPoint);

  return defineConfig(
    ...generateTypescriptEslintConfig({
      rootDir: dirname,
      extraDevDependencies: includeStorybook
        ? storybookTypescriptExtraDevDependencies
        : [],
    }),
    ...generateReactEslintConfig({
      tailwindEntryPoint: absoluteTailwindPath,
    }),
    ...(includeStorybook ? storybookEslintConfig : []),
    prettierEslintConfig,
    ...(ignores.length > 0 ? [{ ignores }] : []),
  );
}
