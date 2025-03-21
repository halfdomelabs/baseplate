// @ts-check
import url from 'node:url';

/** @type {import("prettier").Config} */
export default {
  tabWidth: 2,
  singleQuote: true,
  trailingComma: 'all',
  semi: true,
  plugins: [
    // workaround for this bug: https://github.com/prettier/prettier-vscode/issues/3641
    url.fileURLToPath(import.meta.resolve('prettier-plugin-packagejson')),
  ],
  // we don't want trailing commas in jsonc files (https://github.com/prettier/prettier/issues/15956)
  overrides: [
    {
      files: '*.jsonc',
      options: { trailingComma: 'none' },
    },
  ],
};
