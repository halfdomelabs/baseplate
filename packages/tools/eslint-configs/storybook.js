// @ts-check

/**
 * @typedef {import('./typescript.js').GenerateTypescriptEslintConfigOptions} GenerateTypescriptEslintConfigOptions
 */

import storybook from 'eslint-plugin-storybook';
import tsEslint from 'typescript-eslint';

/** @type {GenerateTypescriptEslintConfigOptions} */
export const storybookTypescriptEslintOptions = {
  extraDevDependencies: [
    // allow dev dependencies for Storybook configuration block
    '.storybook/**/*.{js,ts,tsx,jsx}',
    // allow dev dependencies for Storybook
    '**/*.stories.{js,ts,tsx,jsx}',
    // allow dev dependencies for MDX files
    '**/*.mdx',
  ],
};

export const storybookEslintConfig = tsEslint.config(
  // Storybook
  // @ts-ignore -- TypeScript resolution bug where it expects a named export called default
  storybook.configs['flat/recommended'],

  // Ignores
  {
    ignores: ['storybook-static', '!.storybook'],
  },
);
