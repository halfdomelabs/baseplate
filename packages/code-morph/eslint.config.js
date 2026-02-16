import { defineNodeEslintConfig } from '@baseplate-dev/tools/eslint-node';

export default defineNodeEslintConfig({
  dirname: import.meta.dirname,
  ignores: ['src/morphers/tests/*/**/*'],
});
