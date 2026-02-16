// @ts-check

import storybook from 'eslint-plugin-storybook';
import { defineConfig } from 'eslint/config';

/** @type {string[]} */
export const storybookTypescriptExtraDevDependencies = [
  // allow dev dependencies for Storybook configuration block
  '.storybook/**/*.{js,ts,tsx,jsx}',
  // allow dev dependencies for Storybook
  '**/*.stories.{js,ts,tsx,jsx}',
  // allow dev dependencies for MDX files
  '**/*.mdx',
];

export const storybookEslintConfig = defineConfig(
  // Storybook
  // @ts-ignore -- TypeScript resolution bug where it expects a named export called default
  storybook.configs['flat/recommended'],

  // Ignores
  {
    ignores: ['storybook-static', '!.storybook'],
  },
);
