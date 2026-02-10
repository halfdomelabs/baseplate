// @ts-check

import eslint from '@eslint/js';
import vitest from '@vitest/eslint-plugin';
import { importX } from 'eslint-plugin-import-x';
import perfectionist from 'eslint-plugin-perfectionist';
import eslintPluginUnicorn from 'eslint-plugin-unicorn';
import unusedImports from 'eslint-plugin-unused-imports';
import globals from 'globals';
import tsEslint from 'typescript-eslint';

import noUnusedGeneratorDependencies from './rules/no-unused-generator-dependencies.js';

/**
 * @typedef {Object} GenerateTypescriptEslintConfigOptions
 * @property {string[]} [extraTsFileGlobs] - Additional file globs to lint with Typescript
 * @property {string[]} [extraDevDependencies] - Additional globs for dev dependencies
 * @property {string[]} [extraDefaultProjectFiles] - Additional default project files
 */

const KEEP_UNUSED_IMPORTS =
  process.env.BASEPLATE_KEEP_UNUSED_IMPORTS === 'true';

/**
 * Generates a Typescript ESLint configuration
 * @param {GenerateTypescriptEslintConfigOptions[]} [options=[]] - Configuration options
 */
export function generateTypescriptEslintConfig(options = []) {
  const tsFileGlobs = [
    '**/*.{ts,tsx}',
    ...options.flatMap((option) => option.extraTsFileGlobs ?? []),
  ];
  const devDependencies = [
    // allow dev dependencies for test files
    '**/*.test-helper.{js,ts,jsx,tsx}',
    '**/*.test.{js,ts,jsx,tsx}',
    '**/*.bench.{js,ts,jsx,tsx}',
    '**/tests/**/*',
    '**/test-helpers/**/*',
    '**/__mocks__/**/*',
    // allow dev dependencies for config files at root level
    '*.{js,ts}',
    '.*.{js,ts}',
    '.workspace-meta/**/*',
    ...options.flatMap((option) => option.extraDevDependencies ?? []),
  ];
  const defaultProjectFiles = [
    'vitest.config.ts',
    ...options.flatMap((option) => option.extraDefaultProjectFiles ?? []),
  ];
  return tsEslint.config(
    // ESLint Configs for all files
    eslint.configs.recommended,
    {
      languageOptions: {
        globals: { ...globals.node },
      },
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
        // Allow named functions to be used in arrow functions to support generic functions being passed in
        // e.g. generic components using forwardRef
        'prefer-arrow-callback': ['error', { allowNamedFunctions: true }],
        // Disallow renaming imports, exports, or destructured variables to the same name.
        'no-useless-rename': 'error',
      },
    },

    // Typescript ESLint Configs
    {
      files: tsFileGlobs,
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
          {
            VariableDeclarator: { object: true, array: false },
            AssignmentExpression: { object: false, array: false },
          },
        ],
        // Ensure consistent usage of type exports
        '@typescript-eslint/consistent-type-exports': 'error',
        // Ensure consistent usage of type imports
        '@typescript-eslint/consistent-type-imports': 'error',
        // Allow more relaxed template expression checks
        '@typescript-eslint/restrict-template-expressions': [
          'error',
          {
            allowBoolean: true,
            allowNumber: true,
          },
        ],
        // Allow constant loop conditions
        '@typescript-eslint/no-unnecessary-condition': [
          'error',
          { allowConstantLoopConditions: true },
        ],
        // Allow ternary operators to be used when checking for empty string
        '@typescript-eslint/prefer-nullish-coalescing': [
          'error',
          { ignoreTernaryTests: true },
        ],

        // Allow redirect and notFound to be thrown from routes (placing in generic config to allow it to be used in *.ts files too)
        '@typescript-eslint/only-throw-error': [
          'error',
          {
            allow: ['NotFoundError', 'Redirect'],
          },
        ],
        '@typescript-eslint/no-unused-vars': KEEP_UNUSED_IMPORTS
          ? 'error'
          : 'off',
      },
    },

    // Unused Imports Configs
    {
      plugins: {
        'unused-imports': unusedImports,
      },
      rules: {
        // Prevent unused imports from being auto-removed if the environment variable is set to true
        // This is useful when AI agents are editing code part by part
        'unused-imports/no-unused-imports': KEEP_UNUSED_IMPORTS
          ? 'off'
          : 'error',
        'unused-imports/no-unused-vars': [
          'error',
          {
            vars: 'all',
            varsIgnorePattern: '^_',
            args: 'after-used',
            argsIgnorePattern: '^_',
          },
        ],
      },
    },

    // Import-X Configs
    importX.flatConfigs.recommended,
    importX.flatConfigs.typescript,
    {
      rules: {
        // Let Typescript handle it since it checks for unresolved imports
        'import-x/namespace': 'off',
        'import-x/default': 'off',
        'import-x/no-unresolved': 'off',

        // Allow named default imports without flagging them as errors
        'import-x/no-named-as-default': 'off',

        // Allow named default members without flagging them as errors
        'import-x/no-named-as-default-member': 'off',

        // Disallow importing dependencies that aren't explicitly listed in the package.json,
        // except for those explicitly allowed under `devDependencies` (e.g., test files)
        'import-x/no-extraneous-dependencies': ['error', { devDependencies }],

        // Disallow import relative packages (e.g., `import '../other-package/foo'`)
        'import-x/no-relative-packages': 'error',

        // Use top-level type imports
        'import-x/consistent-type-specifier-style': [
          'error',
          'prefer-top-level',
        ],
      },
      languageOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        parserOptions: { ecmaVersion: 2022 },
      },
    },

    // Unicorn Configs
    eslintPluginUnicorn.configs['recommended'],
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

        // Allow ternary operators to be used when appropriate (this conflicts with https://typescript-eslint.io/rules/prefer-nullish-coalescing/)
        'unicorn/prefer-logical-operator-over-ternary': 'off',

        // Allow the use of arrow functions in nested scopes
        'unicorn/consistent-function-scoping': [
          'error',
          { checkArrowFunctions: false },
        ],

        // A bit over-eager flagging any module references
        'unicorn/prefer-module': 'off',

        // Allow error variables to be named anything
        'unicorn/catch-error-name': 'off',

        // False positives with array-like functions (https://github.com/sindresorhus/eslint-plugin-unicorn/issues/1394)
        'unicorn/no-array-method-this-argument': 'off',

        // Prevents returning undefined from functions which Typescript assumes is void
        'unicorn/no-useless-undefined': 'off',

        // Allow usage of utf-8 text encoding since it's consistent with the WHATWG spec
        // and autofixing can cause unexpected changes (https://github.com/sindresorhus/eslint-plugin-unicorn/issues/1926)
        'unicorn/text-encoding-identifier-case': 'off',
      },
    },

    // Perfectionist Configs
    {
      plugins: { perfectionist },
      rules: {
        // Enforces a consistent sorting order for import statements
        'perfectionist/sort-imports': [
          'error',
          {
            internalPattern: ['^@src/', '^#'],
            // We use the default groups but ensure we place the side-effect imports last except for instrumentation
            groups: [
              'type-import',
              ['value-builtin', 'value-external'],
              'type-internal',
              'value-internal',
              ['type-parent', 'type-sibling', 'type-index'],
              ['value-parent', 'value-sibling', 'value-index'],
              'ts-equals-import',
              'side-effect',
              'unknown',
            ],
          },
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
      rules: {
        ...vitest.configs.recommended.rules,
        // Helpful in dev but should flag as errors when linting
        'vitest/no-focused-tests': 'error',
        'vitest/no-conditional-expect': 'off',
      },
      settings: {
        vitest: {
          typecheck: true,
        },
      },
    },

    // Baseplate Generator Eslint Rule
    {
      files: ['**/*.generator.ts'],
      plugins: {
        baseplate: {
          rules: {
            'no-unused-generator-dependencies': noUnusedGeneratorDependencies,
          },
        },
      },
      rules: {
        'baseplate/no-unused-generator-dependencies': ['error'],
      },
    },

    // Global Ignores
    { ignores: ['dist', 'node_modules'] },
  );
}
