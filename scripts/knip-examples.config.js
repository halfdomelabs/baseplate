// @ts-check

/**
 * Knip config for the generated example projects.
 *
 * Applied by `scripts/check-example-dependencies.ts` to every example to find
 * dependencies Baseplate declares but nothing imports. It lives in the monorepo
 * rather than in each example because the generator owns the examples'
 * `package.json`, so tooling committed there is wiped by the next
 * `sync-examples`.
 *
 * @type {import('knip').KnipConfig}
 */
export default {
  workspaces: {
    '.': {},
    'apps/*': {
      // Generated apps ship a shadcn-style component library whose components
      // are not all imported yet, so each component file is its own entry
      // point; otherwise every unused component's imports look surplus.
      entry: [
        'src/main.tsx',
        'src/components/**/*.tsx',
        'src/routes/**/*.tsx',
        // GraphQL codegen output; nothing imports it directly, but it is the
        // only consumer of some dependencies.
        'src/gql/**/*.ts',
        // Backend entries; test helpers load via vitest setup, not src/index.ts.
        'src/scripts/**/*.ts',
        'src/**/*.test.ts',
        'src/tests/**/*.ts',
      ],
      // `.css` must be in `project` for the CSS compiler below to resolve @import.
      project: 'src/**/*.{ts,tsx,css}',
      ignore: ['src/route-tree.gen.ts', 'src/generated/**'],
    },
    'libs/*': {
      // index.ts re-exports every component; styles.css and emails are consumed
      // by downstream apps rather than imported internally.
      entry: ['src/index.ts', 'src/styles.css', 'src/emails/**/*.tsx'],
      project: 'src/**/*.{ts,tsx,css}',
    },
  },
  ignoreDependencies: [
    // shipped alongside @testing-library/react so generated apps can write
    // interaction tests without adding a dependency first; the scaffolded
    // tests only need render/screen, so nothing imports it yet
    '@testing-library/user-event',
  ],
  // Enable parsing of CSS so `@import 'tw-animate-css'` counts as usage
  compilers: {
    css: (text) => [...text.matchAll(/(?<=@)import[^;]+/g)].join('\n'),
  },
};
