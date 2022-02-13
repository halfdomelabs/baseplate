import type { Linter } from 'eslint';

interface EslintConfig {
  extraTsconfigProjects?: string[];
  extraRules?: Linter.RulesRecord;
  react?: boolean;
}

export function generateConfig({
  extraTsconfigProjects = [],
  extraRules = {},
  react,
}: EslintConfig): Linter.Config {
  const baseExtends = react
    ? ['airbnb', 'airbnb-typescript', 'airbnb/hooks']
    : ['airbnb-base', 'airbnb-typescript/base'];
  return {
    extends: [
      ...baseExtends,
      'plugin:@typescript-eslint/eslint-recommended',
      'plugin:@typescript-eslint/recommended',
      'plugin:@typescript-eslint/recommended-requiring-type-checking',
      'plugin:import/recommended',
      'plugin:import/typescript',
      'plugin:jest/recommended',
      'plugin:jest/style',
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
      'import/order': [
        'error',
        {
          pathGroups: [
            { pattern: '@app/**', group: 'external', position: 'after' },
          ],
          alphabetize: { order: 'asc' },
        },
      ],
      '@typescript-eslint/require-await': 'off',
      'import/no-extraneous-dependencies': [
        'error',
        { devDependencies: ['**/*.test.ts', 'src/tests/**/*.ts'] },
      ],
      ...extraRules,
    },
    env: {
      node: true,
      browser: false,
      jest: true,
    },
    settings: {
      'import/resolver': {
        typescript: {}, // this loads <rootdir>/tsconfig.json to eslint
      },
    },
  };
}
