// @ts-check
import packageJsonPlugin from 'prettier-plugin-packagejson';

/** @type {import("prettier").Config} */
export default {
  tabWidth: 2,
  singleQuote: true,
  trailingComma: 'all',
  semi: true,
  plugins: [packageJsonPlugin],
  // we don't want trailing commas in jsonc files (https://github.com/prettier/prettier/issues/15956)
  overrides: [
    {
      files: '*.jsonc',
      options: { trailingComma: 'none' },
    },
  ],
};
