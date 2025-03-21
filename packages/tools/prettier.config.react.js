// @ts-check
import url from 'node:url';

import basePrettierConfig from './prettier.config.node.js';

/** @type {import("prettier").Config} */
export default {
  ...basePrettierConfig,
  tailwindFunctions: ['clsx', 'cn', 'cva'],
  plugins: [
    ...(basePrettierConfig.plugins ?? []),
    // workaround for this bug: https://github.com/prettier/prettier-vscode/issues/3641
    url.fileURLToPath(import.meta.resolve('prettier-plugin-tailwindcss')),
  ],
};
