import { defineNodeEslintConfig } from '@baseplate-dev/tools/eslint-node';

export default [
  ...defineNodeEslintConfig({
    dirname: import.meta.dirname,
  }),
  {
    files: ['src/**/*.ts'],
    rules: {
      // These packages pull in the full generator/plugin graph, so a static
      // import puts them on the startup path of every CLI command. Load them
      // with `await import(...)` inside the function that needs them instead.
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '@baseplate-dev/project-builder-common',
                '@baseplate-dev/core-generators',
                '@baseplate-dev/react-generators',
                '@baseplate-dev/fastify-generators',
                '@baseplate-dev/plugin-*',
              ],
              message:
                'Import this dynamically (await import(...)) to keep it off the CLI startup path.',
              allowTypeImports: true,
            },
          ],
        },
      ],
    },
  },
];
