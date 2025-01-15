// @ts-check
import * as prettierPluginPackageJson from 'prettier-plugin-packagejson';

/** @type {import("prettier").Config} */
export default {
  tabWidth: 2,
  singleQuote: true,
  trailingComma: 'all',
  semi: true,
  plugins: [prettierPluginPackageJson],
};
