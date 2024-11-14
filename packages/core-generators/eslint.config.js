import eslintNode from '@halfdomelabs/tools/eslint-node';

export default [
  ...eslintNode,
  {
    ignores: ['**/templates/**/*'],
  },
];
