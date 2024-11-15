// @ts-check

import basePrettierConfig from './prettier.config.node.js';

/** @type {import("prettier").Config} */
export default {
  ...basePrettierConfig,
  tailwindFunctions: ['clsx', 'cn', 'cva'],
  plugins: [
    ...(basePrettierConfig.plugins ?? []),
    'prettier-plugin-tailwindcss',
  ],
};
