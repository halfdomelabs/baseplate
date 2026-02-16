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
  // Tailwind-specific configuration
  tailwindFunctions: ['clsx', 'cn', 'cva'],
  tailwindStylesheet: './src/styles.css',
  // Plugins must be specified as absolute paths due to Prettier limitations
  // See: https://github.com/prettier/prettier/issues/8056
  plugins: [
    ...(basePrettierConfig.plugins ?? []),
    fileURLToPath(import.meta.resolve('prettier-plugin-tailwindcss')),
  ],
};
