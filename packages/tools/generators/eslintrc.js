/**
 * Creates an ESLint configuration based on the given options.
 * @param {object} options - The options for creating the ESLint configuration.
 * @param {boolean} options.react - Indicates whether the configuration should include React rules.
 * @param {boolean} options.typescript - Indicates whether the configuration should include TypeScript rules.
 * @returns {object} The generated ESLint configuration.
 */
module.exports = function createEslintConfig(options) {
  const typescript = options.typescript || false;
  const react = options.react || false;

  const additionalOptions = typescript
    ? {
        parserOptions: {
          project: [
            './tsconfig.json',
            ...(react ? ['./tsconfig.node.json'] : []),
          ],
        },
        settings: {
          'import/resolver': {
            typescript: {},
          },
        },
      }
    : {};

  const typescriptRules = {
    '@typescript-eslint/explicit-function-return-type': [
      'error',
      { allowExpressions: true, allowTypedFunctionExpressions: true },
    ],
    '@typescript-eslint/no-misused-promises': [
      'error',
      { checksVoidReturn: false },
    ],
  };

  const reactRules = {
    'react/require-default-props': 'off',
    'react/jsx-props-no-spreading': 'off',
  };

  const baseConfigs = react
    ? ['airbnb', 'airbnb/hooks', 'plugin:react/jsx-runtime']
    : ['airbnb-base'];

  return {
    root: true,
    ignorePatterns: ['.eslintrc.js'],
    extends: [
      ...(typescript
        ? [
            ...baseConfigs,
            react ? 'airbnb-typescript' : 'airbnb-typescript/base',
            'plugin:@typescript-eslint/eslint-recommended',
            'plugin:@typescript-eslint/recommended',
            'plugin:@typescript-eslint/recommended-requiring-type-checking',
            'plugin:import/recommended',
            'plugin:import/typescript',
          ]
        : [...baseConfigs, 'plugin:import/recommended']),
      'plugin:jest/recommended',
      'plugin:jest/style',
      'prettier',
    ],
    rules: {
      ...(typescript ? typescriptRules : {}),
      ...(react ? reactRules : {}),
      'import/prefer-default-export': 'off',
      'class-methods-use-this': 'off',
      'no-template-curly-in-string': 'off',
      'no-console': 'error',
      'no-param-reassign': [
        'error',
        // allows for use in immer (https://github.com/immerjs/immer/issues/189)
        { props: true, ignorePropertyModificationsForRegex: ['^draft'] },
      ],
      'import/order': [
        'error',
        {
          pathGroups: [
            { pattern: 'src/**', group: 'external', position: 'after' },
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
            '**/setupTests.ts',
            'vite.config.ts',
          ],
        },
      ],
    },
    env: {
      node: true,
      browser: react,
      jest: true,
    },
    ...additionalOptions,
  };
};
