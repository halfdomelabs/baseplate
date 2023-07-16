/**
 * Creates an ESLint configuration based on the given options.
 * @param {object} options - The options for creating the ESLint configuration.
 * @param {boolean} options.react - Indicates whether the configuration should include React rules.
 * @param {boolean} options.storybook - Indicates whether the configuration should include Storybook rules.
 * @param {boolean} options.typescript - Indicates whether the configuration should include TypeScript rules.
 * @param {boolean} options.mdx - Indicates whether the configuration should include MDX rules.
 * @param {string[]} options.additionalTsConfigs - Additional TypeScript configuration files to include.
 * @returns {object} The generated ESLint configuration.
 */
module.exports = function createEslintConfig(options) {
  const typescript = options.typescript || false;
  const react = options.react || false;
  const storybook = options.storybook || false;
  const additionalTsConfigs = options.additionalTsConfigs || [];
  const mdx = options.mdx || false;

  const reactRules = {
    'react/require-default-props': 'off',
    'react/jsx-props-no-spreading': 'off',
  };

  const baseConfigs = react
    ? ['airbnb', 'airbnb/hooks', 'plugin:react/jsx-runtime']
    : ['airbnb-base'];

  const typescriptOverrides = typescript
    ? [
        {
          files: ['*.tsx', '*.ts'],
          extends: [
            react ? 'airbnb-typescript' : 'airbnb-typescript/base',
            'plugin:@typescript-eslint/eslint-recommended',
            'plugin:@typescript-eslint/recommended',
            'plugin:@typescript-eslint/recommended-requiring-type-checking',
          ],
          rules: {
            '@typescript-eslint/explicit-function-return-type': [
              'error',
              { allowExpressions: true, allowTypedFunctionExpressions: true },
            ],
            '@typescript-eslint/no-misused-promises': [
              'error',
              { checksVoidReturn: false },
            ],
          },
          parserOptions: {
            project: ['./tsconfig.json', ...additionalTsConfigs],
          },
          settings: {
            'import/resolver': {
              typescript: {},
            },
          },
        },
      ]
    : [];

  const mdxOverrides = mdx
    ? [
        {
          files: ['*.mdx'],
          extends: 'plugin:mdx/recommended',
          rules: {
            'react/jsx-filename-extension': [
              'error',
              { extensions: ['.jsx', '.tsx', '.mdx'] },
            ],
          },
        },
      ]
    : [];

  return {
    root: true,
    ignorePatterns: ['.eslintrc.js'],
    extends: [
      ...baseConfigs,
      'plugin:import/recommended',
      ...(storybook ? ['plugin:storybook/recommended'] : []),
      'plugin:vitest/recommended',
    ],
    rules: {
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
            '**/*.test-helper.ts',
            '**/*.test.ts',
            '**/*.stories.ts',
            '**/*.mdx',
            'src/tests/**/*.ts',
            '**/__mocks__/*.ts',
            '**/setupTests.ts',
            'vite.config.ts',
          ],
        },
      ],
    },
    overrides: [
      ...typescriptOverrides,
      ...mdxOverrides,
      // make sure prettier is always applied last
      {
        files: ['*'],
        extends: ['prettier'],
      },
    ],
    env: {
      node: true,
      browser: react,
    },
  };
};
