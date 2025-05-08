import { tsCodeFragment, tsImportBuilder } from '@src/renderers/index.js';

export const VITEST_ESLINT_RULES = tsCodeFragment(
  `  // Vitest Configs
  {
    files: ['**/*.test.{ts,js,tsx,jsx}', 'tests/**'],
    plugins: { vitestPlugin },
    rules: {
      ...vitestPlugin.configs.recommended.rules,
      // Helpful in dev but should flag as errors when linting
      'vitest/no-focused-tests': 'error',
    },
    settings: {
      vitest: {
        typecheck: true,
      },
    },
  },`,
  [tsImportBuilder().default('vitestPlugin').from('@vitest/eslint-plugin')],
);
