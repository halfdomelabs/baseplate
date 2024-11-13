import type { FlatConfig } from '@typescript-eslint/utils/ts-eslint';
import type { ConfigWithExtends } from 'typescript-eslint';

import eslintPluginImportX from 'eslint-plugin-import-x';
import reactJsxA11yPlugin from 'eslint-plugin-jsx-a11y';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import storybookPlugin from 'eslint-plugin-storybook';
import tailwindPlugin from 'eslint-plugin-tailwindcss';

import type { GenerateBaseEslintConfigOptions } from './eslint.generator.base.js';

import { generateBaseEslintConfig } from './eslint.generator.base.js';

export type GenerateReactEslintConfigOptions = GenerateBaseEslintConfigOptions;

export function generateReactEslintConfig(
  options: GenerateReactEslintConfigOptions = {},
): FlatConfig.ConfigArray {
  const {
    extraConfigs,
    extraDefaultProjectFiles,
    extraGlobalIgnores,
    ...rest
  } = options;
  const reactConfigs: ConfigWithExtends[] = [
    // React & A11y
    {
      files: ['**/*.{js,mjs,cjs,jsx,mjsx,ts,tsx,mtsx}'],
      extends: [
        reactPlugin.configs.flat?.recommended as FlatConfig.Config,
        reactPlugin.configs.flat?.['jsx-runtime'] as FlatConfig.Config,
        reactJsxA11yPlugin.flatConfigs.recommended,
      ],
      settings: {
        react: {
          version: 'detect',
        },
      },
    },

    // React Hooks
    // eslint-plugin-react-hooks does not use FlatConfig yet (https://github.com/facebook/react/pull/30774)
    {
      files: ['**/*.{js,mjs,cjs,jsx,mjsx,ts,tsx,mtsx}'],
      plugins: {
        'react-hooks': reactHooksPlugin,
      },
      rules: reactHooksPlugin.configs.recommended.rules,
    },

    // Storybook
    {
      files: ['**/*.stories.{ts,tsx,js,jsx,mjs,cjs}'],
      extends: [...storybookPlugin.configs['flat/recommended']],
    },

    // Tailwind
    {
      extends: [...tailwindPlugin.configs['flat/recommended']],
      rules: {
        'tailwindcss/no-custom-classname': ['error', {}],
        'tailwindcss/classnames-order': 'off',
      },
    },

    // Import-X
    eslintPluginImportX.flatConfigs.react,

    // Unicorn
    {
      rules: {
        // We use replace since it is not supported by ES2020
        'unicorn/prefer-string-replace-all': 'off',
        // Allow for pascal casing for components
        'unicorn/filename-case': 'off',
      },
    },
  ];

  return generateBaseEslintConfig({
    extraConfigs: [...reactConfigs, ...(extraConfigs ?? [])],
    extraDefaultProjectFiles: [
      ...(extraDefaultProjectFiles ?? []),
      'vite.config.ts',
      'tailwind.config.ts',
    ],
    extraGlobalIgnores: ['storybook-static', ...(extraGlobalIgnores ?? [])],
    ...rest,
  });
}
