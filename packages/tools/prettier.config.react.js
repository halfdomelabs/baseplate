// @ts-check
import { fileURLToPath } from 'node:url';

import basePrettierConfig from './prettier.config.node.js';

/**
 * Note: This config expects the root of the project to have a `src/styles.css` file
 * where the Tailwind styles are defined.
 */

/** @type {import("prettier").Config} */
export default {
  ...basePrettierConfig,
  tailwindFunctions: ['clsx', 'cn', 'cva'],
  tailwindStylesheet: './src/styles.css',
  plugins: [
    ...(basePrettierConfig.plugins ?? []),
    // workaround for this bug: https://github.com/prettier/prettier-vscode/issues/3641
    fileURLToPath(import.meta.resolve('prettier-plugin-tailwindcss')),
  ],
};
