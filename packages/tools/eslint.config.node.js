// @ts-check

import tsEslint from 'typescript-eslint';

import { prettierEslintConfig } from './eslint-configs/prettier.js';
import { generateTypescriptEslintConfig } from './eslint-configs/typescript.js';

/**
 * @typedef {Object} DefineNodeEslintConfigOptions
 * @property {string} dirname - The import.meta.dirname of the calling package
 * @property {string[]} [extraDefaultProjectFiles] - Additional default project files
 * @property {string[]} [ignores] - Additional ignore patterns
 */

/**
 * Defines a Node.js ESLint configuration for a package
 * @param {DefineNodeEslintConfigOptions} options - Configuration options
 */
export function defineNodeEslintConfig(options) {
  const { dirname, extraDefaultProjectFiles = [], ignores = [] } = options;

  return tsEslint.config(
    ...generateTypescriptEslintConfig({
      rootDir: dirname,
      extraDefaultProjectFiles,
    }),
    prettierEslintConfig,
    ...(ignores.length > 0 ? [{ ignores }] : []),
  );
}
