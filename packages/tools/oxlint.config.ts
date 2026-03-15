import type { OxlintConfig } from 'oxlint';

export default {
  plugins: [
    'eslint',
    'typescript',
    'unicorn',
    'oxc',
    'import',
    'react',
    'vitest',
  ],
  categories: {
    correctness: 'error',
  },
  rules: {
    // These rules do not handle Vitest fixtures properly
    'jest/no-standalone-expect': 'off',
  },
  settings: {},
  env: {
    builtin: true,
  },
  globals: {},
} satisfies OxlintConfig;
