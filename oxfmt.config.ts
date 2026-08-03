import {
  oxfmtConfigBase,
  oxfmtIgnorePatterns,
} from '@baseplate-dev/tools/oxfmt-config-base';

export default {
  ...oxfmtConfigBase,
  ignorePatterns: [
    ...oxfmtIgnorePatterns,
    'examples/**',
    '.changeset/**',
    '.pnpm-store/**',
    '.turbo/**',
    '**/route-tree.gen.ts',
    // fixtures assert exact formatting
    'packages/code-morph/src/morphers/tests/**',
    'packages/sync/src/output/string-merge-algorithms/tests/**',
  ],
};
