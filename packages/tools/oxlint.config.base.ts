import type { OxlintConfig } from 'oxlint';

// ignorePatterns are not inherited via extends due to a known oxlint limitation:
// https://github.com/oxc-project/oxc/issues/10223
// Consumers should spread this into their own ignorePatterns.
export const oxlintIgnorePatterns = [
  '**/dist/**',
  '**/generators/**/templates/**',
];

export default {
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

    // False positives without type information
    'unicorn/require-post-message-target-origin': 'off',

    // In the future we can but right now too many fixes
    'no-shadow': 'off',

    // Style rules from ESLint

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
  ],
  env: {
    builtin: true,
  },
  globals: {},
} as Omit<OxlintConfig, 'extends'>;
