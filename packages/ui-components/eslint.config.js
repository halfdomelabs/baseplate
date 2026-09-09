import { defineReactEslintConfig } from '@baseplate-dev/tools/eslint-react';

export default [
  ...defineReactEslintConfig({
    dirname: import.meta.dirname,
    includeStorybook: true,
  }),
  {
    // Local-only tooling that never ships, so devDependencies are correct here.
    files: ['scripts/**/*.ts'],
    rules: {
      'import-x/no-extraneous-dependencies': [
        'error',
        { devDependencies: true },
      ],
    },
  },
];
