import eslintNodeConfig from '@halfdomelabs/tools/eslint-node';

export default [
  ...eslintNodeConfig,
  {
    ignores: ['templates/**'],
  },
];
