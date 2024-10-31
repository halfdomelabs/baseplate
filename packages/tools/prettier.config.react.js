import basePrettierConfig from './prettier.config.base.js';

/** @type {import("prettier").Config} */
export default {
  ...basePrettierConfig,
  tailwindFunctions: ['clsx', 'cn', 'cva'],
  plugins: [
    ...(basePrettierConfig.plugins ?? []),
    'prettier-plugin-tailwindcss',
  ],
};
