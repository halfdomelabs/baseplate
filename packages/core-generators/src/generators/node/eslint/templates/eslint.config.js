// @ts-nocheck

import eslint from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier/flat';
import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript';
import { importX } from 'eslint-plugin-import-x';
import perfectionist from 'eslint-plugin-perfectionist';
import eslintPluginUnicorn from 'eslint-plugin-unicorn';
import tsEslint from 'typescript-eslint';

const tsFileGlobs = ['**/*.{mts,cts,ts,tsx}'];

// Specifies which patterns of files are allowed to have dev dependencies
// For example, test files are allowed to have dev dependencies
const FILES_WITH_DEV_DEPENDENCIES = TPL_DEV_DEPENDENCIES;

// Specifies which files are ignored by ESLint
const IGNORE_FILES = TPL_IGNORE_FILES;

// Specifies which files should use the default tsconfig.json project
// This is useful for certain files outside the src directory, e.g. config files
const TS_DEFAULT_PROJECT_FILES = TPL_DEFAULT_PROJECT_FILES;

export default tsEslint.config(
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
          allowDefaultProject: TS_DEFAULT_PROJECT_FILES,
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
      'import-x/no-extraneous-dependencies': [
        'error',
        { devDependencies: FILES_WITH_DEV_DEPENDENCIES },
      ],

      // Disallow import relative packages (e.g., `import '../other-package/foo'`)
      'import-x/no-relative-packages': 'error',
    },
    settings: {
      'import-x/resolver-next': [createTypeScriptImportResolver()],
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

      // While we use CJS, we cannot use top-level await
      'unicorn/prefer-top-level-await': 'off',

      // Can be too strict if you prefer to have shorter cases for negated conditions
      'unicorn/no-negated-condition': 'off',

      // Allow usage of utf-8 text encoding since it's consistent with the WHATWG spec
      // and autofixing can cause unexpected changes (https://github.com/sindresorhus/eslint-plugin-unicorn/issues/1926)
      'unicorn/text-encoding-identifier-case': 'off',
    },
  },

  // Perfectionist Configs
  {
    plugins: { perfectionist },
    rules: {
      // Enforces a consistent sorting order for import and export statements
      'perfectionist/sort-imports': [
        'error',
        {
          internalPattern: ['^@src/'],
          // We use the default groups but ensure we place the side-effect imports last except for instrumentation
          groups: [
            'instrument',
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
          customGroups: [
            {
              selector: 'side-effect',
              groupName: 'instrument',
              elementNamePattern: String.raw`instrument(.test-helper)?(\.js)?$`,
            },
          ],
        },
      ],
      'perfectionist/sort-exports': ['error'],
      'perfectionist/sort-named-imports': ['error'],
      'perfectionist/sort-named-exports': ['error'],
    },
  },

  /* TPL_EXTRA_CONFIGS */

  // Global Ignores
  { ignores: IGNORE_FILES },

  eslintConfigPrettier,
);
