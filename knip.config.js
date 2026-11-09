// @ts-check

/** @type {import('knip').KnipConfig} */
export default {
  workspaces: {
    '.': {
      entry: ['.workspace-meta/config.ts', 'scripts/**/*.{js,ts}'],
      // Referenced by the @hookform/resolvers packageExtensions entry in pnpm-workspace.yaml
      ignoreDependencies: ['zod'],
    },
    'packages/*': {
      entry: ['src/index.{ts,tsx}'],
      project: 'src/**/*.{ts,tsx}',
      ignore: ['__mocks__/**'],
      paths: {
        '#src/*': ['./src/*'],
      },
    },
    'packages/ui-components': {
      entry: ['src/index.{ts,tsx}'],
      project: ['src/**/*.{ts,tsx}', 'scripts/**/*.ts'],
      paths: {
        '#src/*': ['./src/*'],
      },
    },
    'packages/sync': {
      entry: ['src/index.{ts,tsx}'],
      project: 'src/**/*.{ts,tsx}',
      paths: {
        '#src/*': ['./src/*'],
      },
    },
    'packages/code-morph': {
      entry: ['src/index.{ts,tsx}', 'src/morphers/**/*.morpher.{ts,tsx}'],
      project: 'src/**/*.{ts,tsx}',
      paths: {
        '#src/*': ['./src/*'],
      },
    },
    'packages/utils': {
      entry: ['src/index.{ts,tsx}', 'src/node.{ts,tsx}'],
      project: 'src/**/*.{ts,tsx}',
      paths: {
        '#src/*': ['./src/*'],
      },
    },
    'packages/tools': {
      // tools package has no src directory - it's a config package
      entry: ['*.js', 'oxlint-plugins/*.js', 'oxlint-plugins/*.test.ts'],
      project: ['*.js', 'oxlint-plugins/*.{js,ts}'],
    },
  },
  ignore: ['**/morphers/tests/**', '**/string-merge-algorithms/tests/**'],
  ignoreDependencies: [
    // Tailwind v4 is not recognized as a dependency by Knip
    'tailwindcss',
    // Used for agentic testing
    '@playwright/cli',
  ],
  // Enable parsing of CSS
  compilers: {
    css: (text) => [...text.matchAll(/(?<=@)import[^;]+/g)].join('\n'),
  },
};
