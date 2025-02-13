// @ts-check

/**
 * @typedef {import('@typescript-eslint/utils/ts-eslint').FlatConfig.ConfigArray} ConfigArray
 * @typedef {import('@typescript-eslint/utils/ts-eslint').FlatConfig.Config} Config
 * @typedef {import('./typescript').GenerateTypescriptEslintConfigOptions} GenerateTypescriptEslintConfigOptions
 */

import eslintPluginImportX from 'eslint-plugin-import-x';
import reactJsxA11yPlugin from 'eslint-plugin-jsx-a11y';
import reactPlugin from 'eslint-plugin-react';
// @ts-ignore eslint-plugin-react-hooks does not have typings
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import tsEslint from 'typescript-eslint';

/** @type {GenerateTypescriptEslintConfigOptions} */
export const reactTypescriptEslintOptions = {
  extraDefaultProjectFiles: ['vite.config.ts'],
};

/** @type {ConfigArray} */
export const reactEslintConfig = tsEslint.config(
  // React & A11y
  {
    files: ['**/*.{js,mjs,cjs,jsx,mjsx,ts,tsx,mtsx}'],
    extends: [
      /** @type { Config } */ (reactPlugin.configs.flat?.recommended),
      /** @type { Config } */ (reactPlugin.configs.flat?.['jsx-runtime']),
      reactJsxA11yPlugin.flatConfigs.recommended,
    ],
    settings: {
      react: {
        version: 'detect',
      },
    },
  },

  // Typescript
  {
    files: ['**/*.{tsx,mtsx}'],
    rules: {
      // Allow promises to be returned from functions for attributes in React
      // to allow for React Hook Form handleSubmit to work as expected
      // See https://github.com/orgs/react-hook-form/discussions/8020
      '@typescript-eslint/no-misused-promises': [
        'error',
        { checksVoidReturn: { attributes: false } },
      ],
    },
  },

  // React Hooks
  // eslint-plugin-react-hooks does not use FlatConfig yet (https://github.com/facebook/react/pull/30774)
  {
    files: ['**/*.{js,mjs,cjs,jsx,mjsx,ts,tsx,mtsx}'],
    plugins: {
      'react-hooks': /** @type { any } */ (reactHooksPlugin),
    },
    rules: /** @type { any } */ (reactHooksPlugin.configs.recommended).rules,
  },

  // Import-X
  eslintPluginImportX.flatConfigs.react,

  // Unicorn
  {
    rules: {
      // We use replace since it is not supported by ES2020
      'unicorn/prefer-string-replace-all': 'off',
      // Allow PascalCase for React components
      'unicorn/filename-case': 'off',
    },
  },
);

export default reactEslintConfig;
