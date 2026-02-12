// @ts-check

/**
 * @typedef {import('./typescript.js').GenerateTypescriptEslintConfigOptions} GenerateTypescriptEslintConfigOptions
 */

import eslintPluginImportX from 'eslint-plugin-import-x';
import reactJsxA11yPlugin from 'eslint-plugin-jsx-a11y';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tsEslint from 'typescript-eslint';

/** @type {GenerateTypescriptEslintConfigOptions} */
export const reactTypescriptEslintOptions = {
  extraDefaultProjectFiles: [],
};

export const reactEslintConfig = tsEslint.config(
  // React & A11y
  {
    files: ['**/*.{js,mjs,cjs,jsx,mjsx,ts,tsx,mtsx}'],
    languageOptions: {
      globals: { ...globals.browser },
    },
    extends: [
      reactPlugin.configs.flat?.recommended,
      reactPlugin.configs.flat?.['jsx-runtime'],
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
      // Allow floating navigate from useNavigate to be handled by the router
      '@typescript-eslint/no-floating-promises': [
        'error',
        {
          allowForKnownSafeCalls: ['UseNavigateResult'],
        },
      ],
    },
  },

  // React Hooks
  reactHooksPlugin.configs.flat['recommended-latest'],
  {
    rules: {
      // Disable new strict rules from react-hooks v7 until we enable React Compiler
      'react-hooks/refs': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/preserve-manual-memoization': 'off',
      'react-hooks/incompatible-library': 'off',
    },
  },

  // Import-X
  eslintPluginImportX.flatConfigs.react,

  // Unicorn
  {
    rules: {
      // Support kebab case with - prefix to support ignored files in routes and $ prefix for Tanstack camelCase files
      'unicorn/filename-case': [
        'error',
        {
          cases: {
            kebabCase: true,
          },
          ignore: [
            String.raw`^-[a-z0-9\-\.]+$`,
            String.raw`^\$[a-zA-Z0-9\.]+$`,
          ],
        },
      ],
    },
  },

  // Global ignores
  {
    ignores: ['**/route-tree.gen.ts'],
  },
);
