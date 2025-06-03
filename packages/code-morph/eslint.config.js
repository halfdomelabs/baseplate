import eslintNode from '@baseplate-dev/tools/eslint-node';

export default [
  ...eslintNode,
  {
    ignores: ['src/morphers/tests/*/**/*'],
  },
];
