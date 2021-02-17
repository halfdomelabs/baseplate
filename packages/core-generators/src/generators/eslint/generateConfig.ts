import type { Linter } from 'eslint';

interface EslintConfig {
  extraTsconfigProjects?: string[];
  extraRules?: Linter.RulesRecord;
}

export function generateConfig({
  extraTsconfigProjects = [],
  extraRules = {},
}: EslintConfig): Linter.Config {
  return {
    extends: [
      'airbnb-typescript/base',
      'plugin:@typescript-eslint/eslint-recommended',
      'plugin:@typescript-eslint/recommended',
      'plugin:@typescript-eslint/recommended-requiring-type-checking',
      'plugin:jest/recommended',
      'plugin:jest/style',
      'prettier',
      'prettier/@typescript-eslint',
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
