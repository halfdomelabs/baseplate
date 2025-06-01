import eslintNode from '@baseplate-dev/tools/eslint-node';

export default [
  ...eslintNode,
  {
    ignores: ['src/output/string-merge-algorithms/tests/**/*'],
  },
];
