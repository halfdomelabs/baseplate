// @ts-check

import tsEslint from 'typescript-eslint';

import { prettierEslintConfig } from './eslint-configs/prettier.js';
import { generateTypescriptEslintConfig } from './eslint-configs/typescript.js';

/** @typedef {import('./eslint-configs/typescript.js').GenerateTypescriptEslintConfigOptions} GenerateTypescriptEslintConfigOptions */

/**
 * Generates a Node.js ESLint configuration with customizable options
 * @param {GenerateTypescriptEslintConfigOptions} [options] - Configuration options
 */
export function generateNodeConfig(options = {}) {
  return tsEslint.config(
    ...generateTypescriptEslintConfig([
      {
        extraDefaultProjectFiles: options.extraDefaultProjectFiles || [],
      },
    ]),
    prettierEslintConfig,
  );
}

export default generateNodeConfig();
