// @ts-check

/** @type {import('knip').KnipConfig} */
export default {
  workspaces: {
    '.': {
      entry: ['.workspace-meta/config.ts', 'scripts/*.{js,ts}'],
    },
    'packages/*': {
      entry: ['src/index.{ts,tsx}', 'src/web/index.{ts,tsx}'],
      project: 'src/**/*.{ts,tsx}',
      ignore: ['src/__mocks__/**'],
      paths: {
        '#src/*': ['./src/*'],
      },
    },
    'plugins/*': {
      entry: [
        'src/index.{ts,tsx}',
        'src/web-export.{ts,tsx}',
        'src/*/*/node.ts',
        'src/*/*/web.ts',
        'src/*/*/common.ts',
      ],
      project: 'src/**/*.{ts,tsx}',
      ignoreDependencies: [
        // necessary for build
        'react-dom',
        '@types/react-dom',
      ],
      paths: {
        '#src/*': ['./src/*'],
      },
    },
    'packages/fastify-generators': {
      entry: ['src/index.{ts,tsx}'],
      project: 'src/**/*.{ts,tsx}',
    },
    'packages/project-builder-web': {
      entry: ['src/main.{ts,tsx}'],
      project: ['src/**/*.{ts,tsx}', 'plugins/*.ts'],
      ignore: [
        // we ignore this file because it may not always be used when there are no feature flags
        'src/hooks/use-feature-flag.ts',
        // weird bugs with knip :(
        'src/services/schema-parser-context.ts',
        'src/types/virtual-module-federation.d.ts',
        'src/services/module-federation.ts',
      ],
      paths: {
        '#src/*': ['./src/*'],
      },
    },
    'packages/project-builder-cli': {
      entry: ['src/index.{ts,tsx}', 'tests/**/*.spec.{ts,tsx}'],
      project: ['src/**/*.{ts,tsx}', 'tests/**/*.{ts,tsx}'],
      ignoreDependencies: [
        // pino-pretty is referenced by string (https://github.com/pinojs/pino/blob/ad864b7ae02b314b9a548614f705a437e0db78c3/docs/transports.md)
        'pino-pretty',
        // we resolve the package by string in src/server.ts
        '@baseplate-dev/project-builder-web',
      ],
      paths: {
        '#src/*': ['./src/*'],
      },
    },
    'packages/project-builder-test': {
      entry: ['src/index.{ts,tsx}'],
      project: 'src/**/*.{ts,tsx}',
      ignore: ['src/tests/*.ts'],
      ignoreDependencies: [
        // pino-pretty is referenced by string (https://github.com/pinojs/pino/blob/ad864b7ae02b314b9a548614f705a437e0db78c3/docs/transports.md)
        'pino-pretty',
        // we resolve the package by string in src/commands/serve.ts
        '@baseplate-dev/project-builder-web',
      ],
      paths: {
        '#src/*': ['./src/*'],
      },
    },
    'packages/project-builder-common': {
      entry: ['src/index.{ts,tsx}'],
      project: 'src/**/*.{ts,tsx}',
      ignoreDependencies: [
        // we load the plugins dynamically from the package.json
        '@baseplate-dev/plugin-*',
      ],
    },
    'packages/ui-components': {
      entry: ['src/index.{ts,tsx}'],
      project: 'src/**/*.{ts,tsx}',
      ignoreDependencies: [
        // mdx files - https://github.com/webpro-nl/knip/issues/494
        '@storybook/blocks',
      ],
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
      project: ['src/**/*.{ts,tsx}', 'tests/**/*.{ts,tsx}'],
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
      project: 'src/**/*.{ts,tsx}',
      ignoreDependencies: [
        // automatically imported by eslint-plugin-import-x
        'eslint-import-resolver-typescript',
      ],
    },
  },
  ignore: [
    'tests/**',
    '**/templates/**',
    '**/morphers/tests/**',
    '**/string-merge-algorithms/tests/**',
    '**/generated/**',
  ],
  ignoreBinaries: ['only-allow'],
  ignoreDependencies: [
    // we're not using vitest coverage
    '@vitest/coverage-v8',
    // we can't import the plugin directly into the config because VSCode won't work otherwise
    // https://github.com/prettier/prettier/discussions/15167
    'prettier-plugin-packagejson',
    'prettier-plugin-tailwindcss',
    // Tailwind v4 is not recognized as a dependency by Knip
    'tailwindcss',
  ],
  // Enable parsing of CSS
  compilers: {
    css: (text) => [...text.matchAll(/(?<=@)import[^;]+/g)].join('\n'),
  },
};
