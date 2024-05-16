/**
 * Creates an ESLint configuration based on the given options.
 * @param {object} options - The options for creating the ESLint configuration.
 * @param {boolean} options.react - Indicates whether the configuration should include React rules.
 * @param {boolean} options.storybook - Indicates whether the configuration should include Storybook rules.
 * @param {boolean} options.typescript - Indicates whether the configuration should include TypeScript rules.
 * @param {boolean} options.mdx - Indicates whether the configuration should include MDX rules.
 * @param {string[]} options.additionalTsConfigs - Additional TypeScript configuration files to include.
 * @returns {import("eslint").Linter.Config} The generated ESLint configuration.
 */
module.exports = function createEslintConfig(options) {
  const typescript = options.typescript || false;
  const react = options.react || false;
  const storybook = options.storybook || false;
  const additionalTsConfigs = options.additionalTsConfigs || [];
  const mdx = options.mdx || false;

  const typescriptOverrides = typescript
    ? [
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
            '@typescript-eslint/prefer-nullish-coalescing': 'warn',
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
    ignorePatterns: [
      '/coverage',
      '/dist',
      '/node_modules',
      'vitest.config.ts',
      '*.md',
      'LICENSE',
      'README.md',
      'templates/',
    ],
    plugins: ['import'],
    settings: {
      react: { version: 'detect' },
    },
    extends: [
      'eslint:recommended',
      ...(react
        ? [
            'plugin:react/recommended',
            'plugin:react-hooks/recommended',
            'plugin:react/jsx-runtime',
            'plugin:jsx-a11y/recommended',
            'plugin:tailwindcss/recommended',
          ]
        : []),
      ...(storybook ? ['plugin:storybook/recommended'] : []),
      'plugin:vitest/recommended',
    ],
    rules: {
      // useful for replacing _.omit e.g. const { a, ...rest } = obj
      'no-unused-vars': ['error', { ignoreRestSiblings: true }],
      ...(react
        ? {
            'tailwindcss/no-custom-classname': ['error', {}],
            'tailwindcss/classnames-order': 'off',
          }
        : {}),
    },
    overrides: [
      ...typescriptOverrides,
      ...mdxOverrides,
      // make sure prettier and rule overrides are always applied last
      {
        files: ['*'],
        extends: ['prettier'],
        settings: {
          'import/internal-regex': '^@src/',
        },
        rules: {
          // we should prefer logger over console
          'no-console': 'error',
          // ensure we alphabetize imports for easier reading
          'import/order': [
            'error',
            {
              groups: [
                ['builtin', 'external'],
                ['internal', 'parent', 'sibling', 'index', 'object'],
              ],
              'newlines-between': 'always',
              alphabetize: { order: 'asc' },
            },
          ],
          // disable unnecessary import rules: https://typescript-eslint.io/linting/troubleshooting/performance-troubleshooting/#eslint-plugin-import
          'import/named': 'off',
          'import/namespace': 'off',
          'import/default': 'off',
          'import/no-named-as-default-member': 'off',
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
                'vite.config.ts',
                '.eslintrc.js',
                '.eslintrc.cjs',
                'prettier.config.js',
                'prettier.config.cjs',
                'postcss.config.js',
                'postcss.config.cjs',
                'tailwind.config.js',
                'tailwind.config.cjs',
              ],
            },
          ],
        },
      },
      {
        files: ['scripts/**/*'],
        rules: {
          'no-console': 'off',
        },
      },
    ],
    env: {
      node: true,
      browser: react,
      es2023: true,
    },
  };
};
