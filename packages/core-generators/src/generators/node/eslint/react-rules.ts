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
    rules: {
      // Disable for Base UI's render prop pattern where content is injected via useRender
      'jsx-a11y/anchor-has-content': 'off',
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

      // Component return types are overwhelmingly restatements of what TS already
      // infers from JSX (e.g. React.ReactElement); not worth the annotation noise
      '@typescript-eslint/explicit-function-return-type': 'off',

      // Pure duplication with TypeScript prop typing
      'react/prop-types': 'off',
    },
  },

  // React Hooks
  reactHooksPlugin.configs.flat['recommended-latest'],
  {
    rules: {
      // Disable new strict rules from react-hooks v7 until we enable React Compiler
      'react-hooks/refs': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/preserve-manual-memoization': 'off',
      'react-hooks/incompatible-library': 'off',
    },
  },

  // Import-X
  eslintPluginImportX.flatConfigs.react,
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
