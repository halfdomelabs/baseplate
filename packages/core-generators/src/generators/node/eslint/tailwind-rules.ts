import { tsCodeFragment, tsImportBuilder } from '#src/renderers/index.js';

export const TAILWIND_ESLINT_CONFIG = tsCodeFragment(
  `
  // Tailwind CSS Correctness
  eslintPluginBetterTailwindcss.configs['correctness'],
  {
    settings: {
      'better-tailwindcss': {
        entryPoint: './src/styles.css',
      },
    },
  },
  {
    rules: {
      'better-tailwindcss/no-unknown-classes': [
        'error',
        {
          detectComponentClasses: true,
          ignore: ['toaster'],
        },
      ],
    },
  },
`,
  [
    tsImportBuilder()
      .default('eslintPluginBetterTailwindcss')
      .from('eslint-plugin-better-tailwindcss'),
  ],
);
