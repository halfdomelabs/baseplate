// @ts-check

/**
 * @typedef {import('@typescript-eslint/utils/ts-eslint').FlatConfig.ConfigArray} ConfigArray
 */

// @ts-ignore eslint-plugin-react-hooks does not have typings
import tailwindPlugin from 'eslint-plugin-tailwindcss';

export const tailwindTypescriptEslintOptions = {
  extraDefaultProjectFiles: ['tailwind.config.ts'],
};

/** @type {ConfigArray} */
export const tailwindEslintConfig = [
  // Tailwind
  ...tailwindPlugin.configs['flat/recommended'],
  {
    rules: {
      'tailwindcss/no-custom-classname': ['error', {}],
      'tailwindcss/classnames-order': 'off',
    },
  },
];

export default tailwindEslintConfig;
