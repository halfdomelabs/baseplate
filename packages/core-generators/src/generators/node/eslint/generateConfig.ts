import type { Linter } from 'eslint';

interface EslintConfig {
  extraTsconfigProjects?: string[];
  extraRules?: Linter.RulesRecord;
  react?: boolean;
  disableJest?: boolean;
}

export function generateConfig({
  extraTsconfigProjects = [],
  extraRules = {},
  react,
  disableJest,
}: EslintConfig): Linter.Config {
  const baseExtends = react
    ? [
        'airbnb',
        'airbnb-typescript',
        'airbnb/hooks',
        'plugin:react/jsx-runtime',
      ]
    : ['airbnb-base', 'airbnb-typescript/base'];
  const reactRules: Linter.RulesRecord = !react
    ? {}
    : {
        'react/require-default-props': 'off',
        'react/jsx-props-no-spreading': 'off',
        'no-alert': 'off',
      };
  return {
    extends: [
      ...baseExtends,
      'plugin:@typescript-eslint/eslint-recommended',
      'plugin:@typescript-eslint/recommended',
      'plugin:@typescript-eslint/recommended-requiring-type-checking',
      'plugin:import/recommended',
      'plugin:import/typescript',
      ...(disableJest ? [] : ['plugin:jest/recommended', 'plugin:jest/style']),
      'prettier',
    ],
    parserOptions: {
      project: ['./tsconfig.json', ...extraTsconfigProjects],
    },
    rules: {
      '@typescript-eslint/explicit-function-return-type': [
        'error',
        { allowExpressions: true, allowTypedFunctionExpressions: true },
      ],
      'import/prefer-default-export': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { args: 'none' }],
      'no-underscore-dangle': ['error', { allow: ['__typename'] }],
      'import/order': [
        'error',
        {
          pathGroups: [
            {
              pattern: react ? 'src/**' : '@src/**',
              group: 'external',
              position: 'after',
            },
          ],
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
      '@typescript-eslint/require-await': 'off',
      'import/no-extraneous-dependencies': [
        'error',
        {
          devDependencies: [
            '**/*.test.ts',
            'src/tests/**/*.ts',
            'scripts/**/*.ts',
            ...(react ? ['vite.config.ts'] : []),
          ],
        },
      ],
      '@typescript-eslint/no-misused-promises': [
        'error',
        {
          checksVoidReturn: false,
        },
      ],
      ...reactRules,
      ...extraRules,
    },
    overrides: [
      {
        files: ['scripts/*'],
        rules: {
          'no-console': 'off',
        },
      },
    ],
    env: {
      node: true,
      browser: false,
      ...(disableJest ? {} : { jest: true }),
    },
    settings: {
      'import/resolver': {
        typescript: {}, // this loads <rootdir>/tsconfig.json to eslint
      },
    },
  };
}
