import { tsCodeFragment, tsImportBuilder } from '@src/renderers/index.js';

export const REACT_ESLINT_RULES = tsCodeFragment(
  `
  // React & A11y
  {
    files: ['**/*.{js,mjs,cjs,jsx,mjsx,ts,tsx,mtsx}'],
    extends: [
      reactPlugin.configs.flat?.recommended,
      reactPlugin.configs.flat?.['jsx-runtime'],
      reactJsxA11yPlugin.flatConfigs.recommended,
    ],
    settings: {
      react: {
        version: 'detect',
      },
    },
  },

  // Typescript
  {
    files: ['**/*.{tsx,mtsx}'],
    rules: {
      // Allow promises to be returned from functions for attributes in React
      // to allow for React Hook Form handleSubmit to work as expected
      // See https://github.com/orgs/react-hook-form/discussions/8020
      '@typescript-eslint/no-misused-promises': [
        'error',
        { checksVoidReturn: { attributes: false } },
      ],
    },
  },

  // React Hooks
  reactHooksPlugin.configs['recommended-latest'],

  // Import-X
  eslintPluginImportX.flatConfigs.react,

  // Unicorn
  {
    rules: {
      // We use replace since it is not supported by ES2020
      'unicorn/prefer-string-replace-all': 'off',
      // Allow PascalCase for React components
      'unicorn/filename-case': 'off',
    },
  },
`,
  [
    tsImportBuilder()
      .default('eslintPluginImportX')
      .from('eslint-plugin-import-x'),
    tsImportBuilder()
      .default('reactJsxA11yPlugin')
      .from('eslint-plugin-jsx-a11y'),
    tsImportBuilder().default('reactPlugin').from('eslint-plugin-react'),
    tsImportBuilder()
      .default('reactHooksPlugin')
      .from('eslint-plugin-react-hooks'),
  ],
);
