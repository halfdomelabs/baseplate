// @ts-check

/**
 * @typedef {import('./typescript.js').GenerateTypescriptEslintConfigOptions} GenerateTypescriptEslintConfigOptions
 */

/**
 * @typedef {Object} GenerateReactEslintConfigOptions
 * @property {string | null} [tailwindEntryPoint] - Absolute path to Tailwind CSS entry file (e.g., path.join(import.meta.dirname, 'src/styles.css')). Pass null to disable Tailwind linting.
 */

import eslintPluginBetterTailwindcss from 'eslint-plugin-better-tailwindcss';
import eslintPluginImportX from 'eslint-plugin-import-x';
import reactJsxA11yPlugin from 'eslint-plugin-jsx-a11y';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import { defineConfig } from 'eslint/config';
import globals from 'globals';

/** @type {GenerateTypescriptEslintConfigOptions} */
export const reactTypescriptEslintOptions = {
  extraDefaultProjectFiles: [],
};

/**
 * Generates a React ESLint configuration
 * @param {GenerateReactEslintConfigOptions} options - Configuration options
 */
export function generateReactEslintConfig(options) {
  return defineConfig(
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
    // @ts-ignore - bug with incompatible types between @types/eslint and typescript eslint config - https://github.com/un-ts/eslint-plugin-import-x/issues/421
    eslintPluginImportX.flatConfigs.react,

    // Better Tailwindcss - correctness rules only (formatting handled by Prettier)
    // Only enable if tailwindEntryPoint is provided (not null/undefined)
    ...(options.tailwindEntryPoint !== null &&
    options.tailwindEntryPoint !== undefined
      ? /** @type {any[]} */ ([
          eslintPluginBetterTailwindcss.configs['correctness'],
          {
            settings: {
              'better-tailwindcss': {
                entryPoint: options.tailwindEntryPoint,
              },
            },
          },
          {
            rules: {
              // Detect custom component classes defined in @layer components
              'better-tailwindcss/no-unknown-classes': [
                'error',
                {
                  detectComponentClasses: true,
                  // Ignore classes used in custom component classes
                  ignore: [
                    'toaster', // Sonner library class
                  ],
                },
              ],
            },
          },
        ])
      : []),

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
}
