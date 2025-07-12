import { tsCodeFragment, tsImportBuilder } from '#src/renderers/index.js';

export const REACT_ESLINT_RULES = tsCodeFragment(
  `
  // React & A11y
  {
    files: ['**/*.{js,mjs,cjs,jsx,mjsx,ts,tsx,mtsx}'],
    extends: [
      reactPlugin.configs.flat.recommended,
      reactPlugin.configs.flat['jsx-runtime'],
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

      // Allow redirect and notFound to be thrown from routes
      '@typescript-eslint/only-throw-error': [
        'error',
        {
          allow: ['NotFoundError', 'Redirect'],
        },
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
      // Support kebab case with - prefix to support ignored files in routes and $ prefix for Tanstack camelCase files
      'unicorn/filename-case': [
        'error',
        {
          cases: {
            kebabCase: true,
          },
          ignore: [String.raw\`^-[a-z0-9\\-\\.]+$\`, String.raw\`^\\$[a-zA-Z0-9\\.]+$\`],
        },
      ],
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
