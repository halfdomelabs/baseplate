/** @typedef {import('oxlint').OxlintConfig} OxlintConfig */

// ignorePatterns are not inherited via extends due to a known oxlint limitation:
// https://github.com/oxc-project/oxc/issues/10223
// Consumers should spread this into their own ignorePatterns.

/** @type {string[]} */
export const oxlintIgnorePatterns = [
  '**/dist/**',
  '**/generators/**/templates/**',
  '**/__mocks__/**',
  '**/route-tree.gen.ts',
];

export const oxlintConfigBase = {
  plugins: ['eslint', 'typescript', 'unicorn', 'oxc', 'import', 'react'],
  categories: {
    correctness: 'error',
    suspicious: 'error',
  },
  rules: {
    // We want to flag any console.logs but other uses of console are allowed
    'no-console': ['error', { allow: ['debug', 'info', 'warn', 'error'] }],
    // Not necessary for React 17+
    'react/react-in-jsx-scope': 'off',
    // Allow components passed as props (e.g. react-day-picker `components={{}}`)
    // which are a safe, intentional pattern
    'react/no-unstable-nested-components': ['error', { allowAsProps: true }],
    // Allow unassigned imports for CSS and Vitest
    'no-unassigned-import': [
      'error',
      {
        allow: ['**/*.css', '**/vitest'],
      },
    ],
    // Allow the use of arrow functions in nested scopes
    'unicorn/consistent-function-scoping': [
      'error',
      { checkArrowFunctions: false },
    ],
    // Allow named default imports without flagging them as errors
    'import/no-named-as-default': 'off',

    // Allow named default members without flagging them as errors
    'import/no-named-as-default-member': 'off',

    // Use top-level type imports (e.g. `import type { Foo } from '...'`)
    'import/consistent-type-specifier-style': ['error', 'prefer-top-level'],

    // False positives without type information
    'unicorn/require-post-message-target-origin': 'off',

    // In the future we can but right now too many fixes
    'no-shadow': 'off',

    // We use a leading underscore convention for private/internal fields
    // (e.g. `_rhfId`, `_definitionFileContentsHash`)
    'no-underscore-dangle': 'off',

    // Not previously enforced and would require too many fixes right now.
    // Candidate for a future stricter pass.
    'typescript/consistent-return': 'off',

    // Style rules from ESLint

    // Import sorting (just declaration members)
    'eslint/sort-imports': [
      'error',
      { ignoreCase: true, ignoreDeclarationSort: true },
    ],

    // Enforce using concise arrow function syntax when possible.
    'no-case-declarations': ['error'],
    'no-empty': ['error'],
    'no-fallthrough': ['error', { allowEmptyCase: false }],
    'no-prototype-builtins': 'error',
    'no-regex-spaces': 'error',
    'prefer-template': 'error',
    'arrow-body-style': ['error', 'as-needed'],
    'no-var': 'error',
    'prefer-const': [
      'error',
      {
        destructuring: 'any',
        ignoreReadBeforeAssign: false,
      },
    ],
    'prefer-rest-params': 'error',
    'prefer-spread': 'error',
    'no-empty-function': 'error',
    // Enforce object shorthand syntax to keep object properties concise
    'object-shorthand': ['error', 'always'],
    // Prefer arrow functions for callbacks but allow named functions to support
    // generic functions being passed in (e.g. generic components using forwardRef)
    'prefer-arrow-callback': ['error', { allowNamedFunctions: true }],
    'prefer-destructuring': [
      'error',
      {
        VariableDeclarator: { object: true, array: false },
        AssignmentExpression: { object: false, array: false },
      },
    ],

    // Typescript rules
    // We can look into disabling but it's pretty overeager
    'typescript/no-unsafe-type-assertion': 'off',
    'typescript/no-unnecessary-type-arguments': 'off',
    // Allow floating navigate from useNavigate to be handled by the router
    'typescript/no-floating-promises': [
      'error',
      { allowForKnownSafeCalls: [{ from: 'file', name: 'navigate' }] },
    ],
    // Re-enable rules that are not default
    'typescript/ban-ts-comment': ['error', { minimumDescriptionLength: 10 }],
    'no-array-constructor': 'error',

    // Type-aware typescript rules ported from ESLint config
    'typescript/no-confusing-void-expression': 'error',
    'typescript/no-deprecated': 'error',
    'typescript/no-dynamic-delete': 'error',
    'typescript/no-empty-object-type': 'error',
    'typescript/no-explicit-any': 'error',
    'typescript/no-invalid-void-type': 'error',
    // Allow promises to be returned from functions for attributes in React
    // to allow for React Hook Form handleSubmit to work as expected
    // See https://github.com/orgs/react-hook-form/discussions/8020
    'typescript/no-misused-promises': [
      'error',
      { checksVoidReturn: { attributes: false } },
    ],
    'typescript/no-mixed-enums': 'error',
    'typescript/no-namespace': 'error',
    'typescript/no-non-null-asserted-nullish-coalescing': 'error',
    'typescript/no-non-null-assertion': 'error',
    'typescript/no-require-imports': 'error',
    'typescript/no-unnecessary-condition': [
      'error',
      { allowConstantLoopConditions: true },
    ],
    'typescript/no-unnecessary-type-conversion': 'error',
    'typescript/no-unnecessary-type-parameters': 'error',
    'typescript/no-unsafe-argument': 'error',
    'typescript/no-unsafe-assignment': 'error',
    'typescript/no-unsafe-call': 'error',
    'typescript/no-unsafe-function-type': 'error',
    'typescript/no-unsafe-member-access': 'error',
    'typescript/no-unsafe-return': 'error',
    'typescript/no-useless-default-assignment': 'error',
    // Allow redirect and notFound to be thrown from routes
    'typescript/only-throw-error': [
      'error',
      {
        allow: [
          {
            from: 'package',
            name: 'NotFoundError',
            package: '@tanstack/router-core',
          },
          {
            from: 'package',
            name: 'Redirect',
            package: '@tanstack/router-core',
          },
        ],
      },
    ],
    'typescript/prefer-literal-enum-member': 'error',
    'typescript/prefer-promise-reject-errors': 'error',
    'typescript/prefer-reduce-type-parameter': 'error',
    'typescript/prefer-return-this-type': 'error',
    'typescript/related-getter-setter-pairs': 'error',
    'typescript/require-await': 'error',
    'typescript/restrict-plus-operands': [
      'error',
      {
        allowAny: false,
        allowBoolean: false,
        allowNullish: false,
        allowNumberAndString: false,
        allowRegExp: false,
      },
    ],
    'typescript/return-await': ['error', 'error-handling-correctness-only'],
    'typescript/unified-signatures': 'error',
    'typescript/use-unknown-in-catch-callback-variable': 'error',
    'typescript/adjacent-overload-signatures': 'error',
    'typescript/array-type': 'error',
    'typescript/ban-tslint-comment': 'error',
    'typescript/class-literal-property-style': 'error',
    'typescript/consistent-generic-constructors': 'error',
    'typescript/consistent-indexed-object-style': 'error',
    'typescript/consistent-type-assertions': 'error',
    'typescript/consistent-type-definitions': 'error',
    'typescript/consistent-type-exports': 'error',
    'typescript/consistent-type-imports': 'error',
    'typescript/dot-notation': 'error',
    'typescript/no-inferrable-types': 'error',
    'typescript/non-nullable-type-assertion-style': 'error',
    'typescript/prefer-find': 'error',
    'typescript/prefer-for-of': 'error',
    'typescript/prefer-function-type': 'error',
    'typescript/prefer-includes': 'error',
    'typescript/prefer-nullish-coalescing': [
      'error',
      { ignoreTernaryTests: true },
    ],
    'typescript/prefer-optional-chain': 'error',
    'typescript/prefer-regexp-exec': 'error',
    'typescript/prefer-string-starts-ends-with': 'error',
    'typescript/explicit-function-return-type': [
      'error',
      { allowExpressions: true, allowTypedFunctionExpressions: true },
    ],
    // Catch new union members with no case handling at all; a `default` clause
    // is treated as covering the remaining members since it's a common,
    // intentional fallback pattern in this codebase. Needed explicitly here since
    // oxlint's rule (unlike @typescript-eslint's) does not default to this behavior.
    'typescript/switch-exhaustiveness-check': [
      'error',
      { considerDefaultExhaustiveForUnions: true },
    ],

    // Unicorn rules
    'unicorn/consistent-assert': 'error',
    'unicorn/consistent-date-clone': 'error',
    'unicorn/consistent-empty-array-spread': 'error',
    'unicorn/consistent-existence-index-check': 'error',
    'unicorn/error-message': 'error',
    'unicorn/escape-case': 'error',
    'unicorn/explicit-length-check': 'error',
    // Support kebab case with - prefix to support ignored files in routes and $ prefix for Tanstack camelCase files.
    'unicorn/filename-case': [
      'error',
      {
        case: 'kebabCase',
        ignore: String.raw`^(-[a-z0-9\-\.]+|\$[a-zA-Z0-9\.]+)$`,
      },
    ],
    'unicorn/new-for-builtins': 'error',
    'unicorn/no-abusive-eslint-disable': 'error',
    'unicorn/no-anonymous-default-export': 'error',
    'unicorn/no-array-for-each': 'error',
    'unicorn/no-array-reduce': 'error',
    'unicorn/no-await-expression-member': 'error',
    'unicorn/no-console-spaces': 'error',
    'unicorn/no-document-cookie': 'error',
    'unicorn/no-hex-escape': 'error',
    'unicorn/no-immediate-mutation': 'error',
    'unicorn/no-lonely-if': 'error',
    'unicorn/no-magic-array-flat-depth': 'error',
    'unicorn/no-negation-in-equality-check': 'error',
    'unicorn/no-new-buffer': 'error',
    'unicorn/no-object-as-default-parameter': 'error',
    'unicorn/no-process-exit': 'error',
    'unicorn/no-static-only-class': 'error',
    'unicorn/no-this-assignment': 'error',
    'unicorn/no-typeof-undefined': 'error',
    'unicorn/no-unnecessary-array-flat-depth': 'error',
    'unicorn/no-unnecessary-array-splice-count': 'error',
    'unicorn/no-unnecessary-slice-end': 'error',
    'unicorn/no-unreadable-array-destructuring': 'error',
    'unicorn/no-unreadable-iife': 'error',
    'unicorn/no-useless-collection-argument': 'error',
    'unicorn/no-useless-error-capture-stack-trace': 'error',
    'unicorn/no-useless-promise-resolve-reject': 'error',
    'unicorn/no-useless-switch-case': 'error',
    'unicorn/no-zero-fractions': 'error',
    'unicorn/numeric-separators-style': ['error'],
    'unicorn/prefer-array-find': 'error',
    'unicorn/prefer-array-flat': 'error',
    'unicorn/prefer-array-flat-map': 'error',
    'unicorn/prefer-array-index-of': 'error',
    'unicorn/prefer-array-some': 'error',
    'unicorn/prefer-at': 'error',
    'unicorn/prefer-bigint-literals': 'error',
    'unicorn/prefer-blob-reading-methods': 'error',
    'unicorn/prefer-class-fields': 'error',
    'unicorn/prefer-classlist-toggle': 'error',
    'unicorn/prefer-code-point': 'error',
    'unicorn/prefer-date-now': 'error',
    'unicorn/prefer-default-parameters': 'error',
    'unicorn/prefer-dom-node-append': 'error',
    'unicorn/prefer-dom-node-dataset': 'error',
    'unicorn/prefer-dom-node-remove': 'error',
    'unicorn/prefer-dom-node-text-content': 'error',
    'unicorn/prefer-event-target': 'error',
    'unicorn/prefer-global-this': 'error',
    'unicorn/prefer-includes': 'error',
    'unicorn/prefer-keyboard-event-key': 'error',
    'unicorn/prefer-math-min-max': 'error',
    'unicorn/prefer-math-trunc': 'error',
    'unicorn/prefer-modern-dom-apis': 'error',
    'unicorn/prefer-modern-math-apis': 'error',
    'unicorn/prefer-native-coercion-functions': 'error',
    'unicorn/prefer-negative-index': 'error',
    'unicorn/prefer-node-protocol': 'error',
    'unicorn/prefer-number-properties': 'error',
    'unicorn/prefer-object-from-entries': 'error',
    'unicorn/prefer-optional-catch-binding': 'error',
    'unicorn/prefer-prototype-methods': 'error',
    'unicorn/prefer-query-selector': 'error',
    'unicorn/prefer-reflect-apply': 'error',
    'unicorn/prefer-regexp-test': 'error',
    'unicorn/prefer-response-static-json': 'error',
    'unicorn/prefer-set-has': 'error',
    'unicorn/prefer-spread': 'error',
    'unicorn/prefer-string-raw': 'error',
    'unicorn/prefer-string-replace-all': 'error',
    'unicorn/prefer-string-slice': 'error',
    'unicorn/prefer-string-trim-start-end': 'error',
    'unicorn/prefer-structured-clone': 'error',
    'unicorn/prefer-ternary': 'error',
    'unicorn/prefer-top-level-await': 'error',
    'unicorn/prefer-type-error': 'error',
    'unicorn/relative-url-style': ['error', 'never'],
    'unicorn/require-array-join-separator': 'error',
    'unicorn/require-module-attributes': 'error',
    'unicorn/require-number-to-fixed-digits-argument': 'error',
    'unicorn/switch-case-braces': ['error', 'always'],
    'unicorn/throw-new-error': 'error',
  },
  overrides: [
    {
      files: ['*.test-helper.ts'],
      rules: {
        // Allow empty patterns in test helper files for vitest fixtures
        'no-empty-pattern': 'off',
      },
    },
    {
      files: ['**/bin/**/*.js'],
      rules: {
        // Allow unassigned imports for bin files
        'import/no-unassigned-import': 'off',
      },
    },
    {
      files: ['eslint.config.js'],
      rules: {
        // Allow unsafe assignments in eslint config files
        'typescript/no-unsafe-assignment': 'off',
      },
    },
  ],
  env: {
    builtin: true,
    node: true,
  },
  globals: {},
  options: {
    typeAware: true,
  },
};
