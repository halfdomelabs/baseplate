import type { OxlintConfig } from 'oxlint';

export default {
  plugins: ['eslint', 'typescript', 'unicorn', 'oxc', 'import', 'react'],
  categories: {
    correctness: 'error',
  },
  rules: {},
  settings: {},
  overrides: [
    {
      files: ['*.test-helper.ts'],
      rules: {
        // Allow empty patterns in test helper files for vitest fixtures
        'no-empty-pattern': 'off',
      },
    },
  ],
  env: {
    builtin: true,
  },
  globals: {},
} satisfies OxlintConfig;
