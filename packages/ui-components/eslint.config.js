import { defineReactEslintConfig } from '@baseplate-dev/tools/eslint-react';

export default defineReactEslintConfig({
  dirname: import.meta.dirname,
  includeStorybook: true,
});
