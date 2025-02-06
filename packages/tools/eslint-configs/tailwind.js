// @ts-check

/**
 * @typedef {import('@typescript-eslint/utils/ts-eslint').FlatConfig.ConfigArray} ConfigArray
 */

// @ts-ignore eslint-plugin-react-hooks does not have typings
import tailwindPlugin from 'eslint-plugin-tailwindcss';

export const tailwindTypescriptEslintOptions = {};

/** @type {ConfigArray} */
export const tailwindEslintConfig = [
  // Tailwind
  ...tailwindPlugin.configs['flat/recommended'],
  {
    rules: {
      'tailwindcss/no-custom-classname': [
        'error',
        {
          // for some reason, VSCode throws an error for this rule so adding the rules manually
          whitelist: [
            'text-muted-foreground',
            'text-destructive',
            'text-style-muted',
            'bg-background',
            'bg-muted',
          ],
        },
      ],
      'tailwindcss/classnames-order': 'off',
    },
  },
];

export default tailwindEslintConfig;
