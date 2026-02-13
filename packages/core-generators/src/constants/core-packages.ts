export const CORE_PACKAGES = {
  // Typescript
  typescript: '5.9.3',

  // Linting
  '@eslint/js': '9.39.2',
  '@vitest/eslint-plugin': '1.6.6',
  eslint: '9.39.2',
  'eslint-config-prettier': '10.1.8',
  'eslint-import-resolver-typescript': '4.4.4',
  'eslint-plugin-import-x': '4.16.1',
  'eslint-plugin-jsx-a11y': '6.10.2',
  'eslint-plugin-perfectionist': '5.4.0',
  'eslint-plugin-react': '7.37.5',
  'eslint-plugin-react-hooks': '7.0.1',
  'eslint-plugin-unicorn': '62.0.0',
  'typescript-eslint': '8.54.0',
  globals: '17.3.0',

  // Formatting
  prettier: '3.8.1',
  'prettier-plugin-packagejson': '3.0.0',

  // Testing
  vite: '7.1.12',
  vitest: '4.0.16',
  'vite-tsconfig-paths': '5.1.4',

  // Utils
  axios: '1.13.5',

  // Monorepo
  turbo: '2.5.0',
} as const;
