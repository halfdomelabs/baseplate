import type { FlatConfig } from '@typescript-eslint/utils/ts-eslint';
import type { ConfigWithExtends } from 'typescript-eslint';

import eslint from '@eslint/js';
import vitest from '@vitest/eslint-plugin';
import eslintConfigPrettier from 'eslint-config-prettier';
import * as tsResolver from 'eslint-import-resolver-typescript';
import eslintPluginImportX from 'eslint-plugin-import-x';
import perfectionist from 'eslint-plugin-perfectionist';
import eslintPluginUnicorn from 'eslint-plugin-unicorn';
import tsEslint from 'typescript-eslint';

export const defaultDevDependencyGlobs = [
  // allow dev dependencies for test files
  '**/*.test-helper.{js,ts}',
  '**/*.test.{js,ts,tsx,jsx}',
  'src/tests/**/*',
  '**/__mocks__/**/*',
  // allow dev dependencies for Storybook
  '**/*.stories.{js,ts,tsx,jsx}',
  // allow dev dependencies for MDX files
  '**/*.mdx',
  // allow dev dependencies for config files at root level
  '*.{js,ts}',
  '.*.{js,ts}',
];

export interface GenerateBaseEslintConfigOptions {
  extraDevDependencies?: string[];
  extraConfigs?: ConfigWithExtends[];
  extraDefaultProjectFiles?: string[];
}

export function generateBaseEslintConfig(
  options: GenerateBaseEslintConfigOptions = {},
): FlatConfig.ConfigArray {
  const devDependencies = [
    ...defaultDevDependencyGlobs,
    ...(options.extraDevDependencies ?? []),
  ];
  const defaultProjectFiles = [
    'vitest.config.ts',
    ...(options.extraDefaultProjectFiles ?? []),
  ];

  return tsEslint.config(
    // ESLint Configs for all files
    eslint.configs.recommended,
    {
      rules: {
        // disallow console.log since that is typically used for debugging
        'no-console': ['error', { allow: ['warn', 'error', 'debug', 'info'] }],
        // Enforce object shorthand syntax to keep object properties concise.
        'object-shorthand': ['error', 'always'],
        // Enforce the use of template literals instead of string concatenation.
        'prefer-template': 'error',
        // Enforce using concise arrow function syntax when possible.
        'arrow-body-style': ['error', 'as-needed'],
        // Encourage the use of arrow functions for callbacks to avoid `this` binding issues.
        'prefer-arrow-callback': 'error',
        // Disallow renaming imports, exports, or destructured variables to the same name.
        'no-useless-rename': 'error',
      },
    },

    // Typescript ESLint Configs
    {
      files: ['**/*.{ts,tsx}'],
      extends: [
        ...tsEslint.configs.strictTypeChecked,
        ...tsEslint.configs.stylisticTypeChecked,
      ],
      languageOptions: {
        parserOptions: {
          projectService: {
            // allow default project for root configs
            allowDefaultProject: defaultProjectFiles,
          },
        },
      },
      rules: {
        // require explicit return types for functions for faster type checking
        '@typescript-eslint/explicit-function-return-type': [
          'error',
          { allowExpressions: true, allowTypedFunctionExpressions: true },
        ],
        // Enforce the use of destructuring for objects where applicable, but not for arrays
        '@typescript-eslint/prefer-destructuring': [
          'error',
          { object: true, array: false },
        ],
        // Ensure consistent usage of type exports
        '@typescript-eslint/consistent-type-exports': 'error',
        // Ensure consistent usage of type imports
        '@typescript-eslint/consistent-type-imports': 'error',
      },
    },

    // Import-X Configs
    eslintPluginImportX.flatConfigs.recommended,
    {
      files: ['**/*.{ts,tsx}'],
      extends: [eslintPluginImportX.flatConfigs.typescript],
    },
    {
      rules: {
        'import-x/no-named-as-default': 'off',
        'import-x/no-named-as-default-member': 'off',
        'import-x/no-extraneous-dependencies': ['error', { devDependencies }],
      },
      settings: {
        'import-x/resolver': { name: 'tsResolver', resolver: tsResolver },
      },
      languageOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        parserOptions: { ecmaVersion: 2022 },
      },
    },

    // Unicorn Configs
    eslintPluginUnicorn.configs['flat/recommended'],
    {
      rules: {
        'unicorn/prevent-abbreviations': 'off',
        'unicorn/no-null': 'off',
      },
    },

    // Perfectionist Configs
    {
      // perfectionist has some nice rules but can be a bit too strict for recommended config
      plugins: { perfectionist },
      rules: {
        'perfectionist/sort-imports': [
          'error',
          { internalPattern: ['@src/**'] },
        ],
        'perfectionist/sort-exports': ['error'],
        'perfectionist/sort-named-imports': ['error'],
        'perfectionist/sort-named-exports': ['error'],
      },
    },

    // Vitest Configs
    {
      files: ['**/*.test.{ts,js,tsx,jsx}', 'tests/**'],
      plugins: { vitest },
      rules: vitest.configs.recommended.rules,
    },

    // Extra Configs
    ...(options.extraConfigs ?? []),

    // Prettier Configs
    eslintConfigPrettier,

    // Global Ignores
    { ignores: ['dist', 'node_modules'] },
  );
}
