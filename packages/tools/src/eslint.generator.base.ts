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
        // Allow named default imports without flagging them as errors
        'import-x/no-named-as-default': 'off',

        // Allow named default members without flagging them as errors
        'import-x/no-named-as-default-member': 'off',

        // Disallow importing dependencies that aren’t explicitly listed in the package.json,
        // except for those explicitly allowed under `devDependencies` (e.g., test files)
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
        // Disable the rule that prevents using abbreviations in identifiers, allowing
        // flexibility in naming, especially for common abbreviations in code.
        'unicorn/prevent-abbreviations': 'off',

        // Disable the rule that disallows `null` values, allowing `null` to be used
        // when necessary (e.g., for nullable types or optional fields).
        'unicorn/no-null': 'off',

        // Allow array callback references without flags, supporting patterns like
        // `array.filter(callbackFunction)`, which can improve readability and code brevity.
        'unicorn/no-array-callback-reference': 'off',
      },
    },

    // Perfectionist Configs
    {
      // perfectionist has some nice rules but can be a bit too strict for recommended config
      plugins: { perfectionist },
      rules: {
        // Enforces a consistent sorting order for import statements. Customizes the sorting
        // to place internal imports (e.g., `@src/**`) in a specific order for readability and structure.
        'perfectionist/sort-imports': [
          'error',
          { internalPattern: ['@src/**'] },
        ],

        // Enforces consistent sorting for export statements, keeping exports organized
        // and making them easier to locate within modules.
        'perfectionist/sort-exports': ['error'],

        // Ensures named imports are sorted alphabetically or in a specified order,
        // promoting a clean and structured appearance for import declarations.
        'perfectionist/sort-named-imports': ['error'],

        // Enforces alphabetical or specified sorting for named exports to maintain
        // consistency, aiding readability and organization within files.
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
