// @ts-check

import prettierConfig from './eslint-configs/prettier.js';
import { generateTypescriptEslintConfig } from './eslint-configs/typescript.js';

/**
 * Generates a Node.js ESLint configuration with customizable options
 * @param {Object} [options] - Configuration options
 * @param {string[]} [options.extraDefaultProjectFiles] - Additional default project files
 * @returns {import('@typescript-eslint/utils/ts-eslint').FlatConfig.ConfigArray} The generated ESLint configuration
 */
export function generateNodeConfig(options = {}) {
  return [
    ...generateTypescriptEslintConfig([
      {
        extraDefaultProjectFiles: options.extraDefaultProjectFiles || [],
      },
    ]),
    prettierConfig,
  ];
}

/** @type {import('@typescript-eslint/utils/ts-eslint').FlatConfig.ConfigArray} */
export default generateNodeConfig();
