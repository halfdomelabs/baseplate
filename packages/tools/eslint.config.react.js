// @ts-check

import tsEslint from 'typescript-eslint';

import { prettierEslintConfig } from './eslint-configs/prettier.js';
import {
  reactEslintConfig,
  reactTypescriptEslintOptions,
} from './eslint-configs/react.js';
import {
  storybookEslintConfig,
  storybookTypescriptEslintOptions,
} from './eslint-configs/storybook.js';
import { generateTypescriptEslintConfig } from './eslint-configs/typescript.js';

export default tsEslint.config(
  ...generateTypescriptEslintConfig([
    reactTypescriptEslintOptions,
    storybookTypescriptEslintOptions,
  ]),
  ...reactEslintConfig,
  ...storybookEslintConfig,
  prettierEslintConfig,
);
