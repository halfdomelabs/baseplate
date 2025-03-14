export const CORE_PACKAGES = {
  // Typescript
  typescript: '5.5.4',

  // Linting
  '@typescript-eslint/eslint-plugin': '7.16.1',
  '@typescript-eslint/parser': '7.16.1',
  eslint: '8.57.0',
  'eslint-plugin-jsx-a11y': '6.9.0',
  'eslint-plugin-react': '7.34.4',
  'eslint-plugin-react-hooks': '4.6.2',
  'eslint-config-prettier': '9.1.0',
  'eslint-import-resolver-typescript': '3.6.1',
  'eslint-plugin-import': '2.29.1',
  'eslint-plugin-vitest': '0.4.1',

  // Formatting
  prettier: '3.3.3',
  'prettier-plugin-packagejson': '2.5.2',

  // Testing
  vitest: '3.0.7',
  'vite-tsconfig-paths': '5.1.4',

  // Utils
  axios: '1.8.3',
} as const;
