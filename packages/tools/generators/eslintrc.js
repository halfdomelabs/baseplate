const baseConfigs = ['airbnb-base', 'plugin:import/recommended'];

const typescriptConfigs = [
  'airbnb-base',
  'airbnb-typescript/base',
  'plugin:@typescript-eslint/eslint-recommended',
  'plugin:@typescript-eslint/recommended',
  'plugin:@typescript-eslint/recommended-requiring-type-checking',
  'plugin:import/recommended',
  'plugin:import/typescript',
];

const typescriptParserOptions = {
  project: './tsconfig.json',
};

const typescriptRules = {
  '@typescript-eslint/explicit-function-return-type': [
    'error',
    { allowExpressions: true, allowTypedFunctionExpressions: true },
  ],
};

const typescriptSettings = {
  'import/resolver': {
    typescript: true,
  },
};

module.exports = function createEslintConfig(options) {
  const typescript = options.typescript || false;
  return {
    root: true,
    parserOptions: typescript ? typescriptParserOptions : {},
    ignorePatterns: ['.eslintrc.js'],
    extends: [
      ...(typescript ? typescriptConfigs : baseConfigs),
      'plugin:jest/recommended',
      'plugin:jest/style',
      'prettier',
    ],
    rules: {
      ...(typescript ? typescriptRules : {}),
      'import/prefer-default-export': 'off',
      'class-methods-use-this': 'off',
      'no-console': 'off',
      'no-template-curly-in-string': 'off',
      'import/order': [
        'error',
        {
          pathGroups: [
            { pattern: '@src/**', group: 'external', position: 'after' },
          ],
          alphabetize: { order: 'asc' },
        },
      ],
      'import/no-extraneous-dependencies': [
        'error',
        {
          devDependencies: [
            '**/*.test.ts',
            'src/tests/**/*.ts',
            '**/__mocks__/*.ts',
          ],
        },
      ],
    },
    env: {
      node: true,
      browser: false,
      jest: true,
    },
    settings: typescript ? typescriptSettings : {},
  };
};
