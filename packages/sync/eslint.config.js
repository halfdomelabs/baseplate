import eslintNode from '@halfdomelabs/tools/eslint-node';

export default [
  ...eslintNode,
  {
    ignores: ['src/output/string-merge-algorithms/tests/**/*'],
  },
];
