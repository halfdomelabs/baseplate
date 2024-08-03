module.exports = {
  root: true,
  plugins: ['import', 'vitest'],
  parserOptions: {
    ecmaVersion: 2021,
  },
  extends: ['eslint:recommended'],
  overrides: [
    {
      files: ['*.tsx', '*.ts'],
      extends: [
        'plugin:@typescript-eslint/recommended-type-checked',
        'plugin:@typescript-eslint/stylistic-type-checked',
      ],
      rules: {
        '@typescript-eslint/no-unused-vars': [
          'error',
          {
            ignoreRestSiblings: true,
          },
        ],
        '@typescript-eslint/no-misused-promises': [
          'error',
          {
            checksVoidReturn: {
              attributes: false,
            },
          },
        ],
        '@typescript-eslint/explicit-function-return-type': [
          'error',
          {
            allowExpressions: true,
            allowTypedFunctionExpressions: true,
          },
        ],
      },
      parserOptions: {
        project: ['./tsconfig.json', './scripts/tsconfig.json'],
      },
      settings: {
        'import/resolver': {
          typescript: {},
        },
      },
    },
    {
      files: ['*'],
      extends: ['prettier'],
      rules: {
        'no-console': 'error',
        'import/order': [
          'error',
          {
            pathGroups: [
              {
                pattern: 'src/**',
                group: 'external',
                position: 'after',
              },
              {
                pattern: '@src/**',
                group: 'external',
                position: 'after',
              },
            ],
            alphabetize: {
              order: 'asc',
              caseInsensitive: true,
            },
          },
        ],
        'import/no-extraneous-dependencies': [
          'error',
          {
            devDependencies: [
              '**/*.test-helper.ts',
              '**/*.test.ts',
              '**/*.stories.ts',
              '**/*.mdx',
              'src/tests/**/*.ts',
              '**/__mocks__/**/*.ts',
              '**/setupTests.ts',
              '.eslintrc.js',
              '.eslintrc.cjs',
              'prettier.config.js',
              'prettier.config.cjs',
            ],
          },
        ],
        '@typescript-eslint/require-await': 'off',
      },
    },
    {
      files: ['scripts/*'],
      rules: {
        'no-console': 'off',
      },
    },
    {
      files: ['*.test.*'],
      rules: {
        'vitest/no-commented-out-tests': 'warn',
      },
    },
  ],
  env: {
    node: true,
    browser: false,
  },
  settings: {
    'import/resolver': {
      typescript: {},
    },
  },
};
