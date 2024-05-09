const basePrettierConfig = require('./prettier.config.base');

/** @type {import("prettier").Config} */
module.exports = {
  ...basePrettierConfig,
  tailwindFunctions: ['clsx', 'cn', 'cva'],
  plugins: [
    ...(basePrettierConfig.plugins || []),
    'prettier-plugin-tailwindcss',
  ],
};
