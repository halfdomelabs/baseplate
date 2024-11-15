// @ts-check

import { prettierEslintConfig } from './eslint-configs/prettier.js';
import {
  reactEslintConfig,
  reactTypescriptEslintOptions,
} from './eslint-configs/react.js';
import {
  storybookEslintConfig,
  storybookTypescriptEslintOptions,
} from './eslint-configs/storybook.js';
import tailwindEslintConfig, {
  tailwindTypescriptEslintOptions,
} from './eslint-configs/tailwind.js';
import { generateTypescriptEslintConfig } from './eslint-configs/typescript.js';

/** @type {import('@typescript-eslint/utils/ts-eslint').FlatConfig.ConfigArray} */
export default [
  ...generateTypescriptEslintConfig([
    reactTypescriptEslintOptions,
    tailwindTypescriptEslintOptions,
    storybookTypescriptEslintOptions,
  ]),
  ...reactEslintConfig,
  ...tailwindEslintConfig,
  ...storybookEslintConfig,
  prettierEslintConfig,
];
