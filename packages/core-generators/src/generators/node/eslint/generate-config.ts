import type { Linter } from 'eslint';

interface EslintConfig {
  extraTsconfigProjects?: string[];
  extraRules?: Linter.RulesRecord;
  react?: boolean;
  disableVitest?: boolean;
}

export function generateConfig({
  extraTsconfigProjects = [],
  extraRules = {},
  react,
  disableVitest,
}: EslintConfig): Linter.LegacyConfig {
  return {
    root: true,
    plugins: ['import', ...(disableVitest ? [] : ['vitest'])],
    parserOptions: {
      ecmaVersion: 2021,
    },
    extends: [
      'eslint:recommended',
      ...(react
        ? [
            'plugin:react/recommended',
            'plugin:react-hooks/recommended',
            'plugin:react/jsx-runtime',
            'plugin:jsx-a11y/recommended',
          ]
        : []),
    ],
    overrides: [
      {
        files: ['*.tsx', '*.ts'],
        extends: [
          'plugin:@typescript-eslint/recommended-type-checked',
          'plugin:@typescript-eslint/stylistic-type-checked',
        ],
        rules: {
          // useful for replacing _.omit e.g. const { a, ...rest } = obj
          '@typescript-eslint/no-unused-vars': [
            'error',
            { ignoreRestSiblings: true },
          ],
          // allows us to pass handleSubmit from React Hook Form to onSubmit
          '@typescript-eslint/no-misused-promises': [
            'error',
            { checksVoidReturn: { attributes: false } },
          ],
          // useful for being explicit about return types and improving Typescript performance
          '@typescript-eslint/explicit-function-return-type': [
            'error',
            { allowExpressions: true, allowTypedFunctionExpressions: true },
          ],
        },
        parserOptions: {
          project: ['./tsconfig.json', ...extraTsconfigProjects],
        },
        settings: {
          'import/resolver': {
            typescript: {},
          },
          react: react
            ? {
                version: 'detect',
              }
            : undefined,
        },
      },
      {
        files: ['*'],
        extends: ['prettier'],
        rules: {
          // we should prefer logger over console
          'no-console': 'error',
          // // ensure we alphabetize imports for easier reading
          'import/order': [
            'error',
            {
              pathGroups: [
                { pattern: 'src/**', group: 'external', position: 'after' },
                { pattern: '@src/**', group: 'external', position: 'after' },
              ],
              alphabetize: { order: 'asc', caseInsensitive: true },
            },
          ],
          // ensure we don't have devDependencies imported in production code
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
                ...(react
                  ? [
                      'vite.config.ts',
                      'postcss.config.js',
                      'postcss.config.cjs',
                      'tailwind.config.js',
                      'tailwind.config.cjs',
                    ]
                  : []),
                '.eslintrc.js',
                '.eslintrc.cjs',
                'prettier.config.js',
                'prettier.config.cjs',
              ],
            },
          ],
          // Fastify plugins are more easily written as async functions and there's no real downside IMO
          '@typescript-eslint/require-await': 'off',
          ...extraRules,
        },
      },
      {
        files: ['scripts/*'],
        rules: {
          'no-console': 'off',
        },
      },
      ...(disableVitest
        ? []
        : [
            {
              files: ['*.test.*'],
              rules: {
                'vitest/no-commented-out-tests': 'warn',
              } as Linter.RulesRecord,
            },
          ]),
    ],
    env: {
      node: true,
      browser: false,
    },
    settings: {
      'import/resolver': {
        typescript: {}, // this loads <rootdir>/tsconfig.json to eslint
      },
    },
  };
}
