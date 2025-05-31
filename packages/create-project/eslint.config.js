import eslintNodeConfig from '@baseplate-dev/tools/eslint-node';

export default [
  ...eslintNodeConfig,
  {
    ignores: ['templates/**'],
  },
];
