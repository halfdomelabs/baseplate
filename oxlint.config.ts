import oxlintConfig from '@baseplate-dev/tools/oxlint-config';
import { defineConfig } from 'oxlint';

export default defineConfig({
  extends: [oxlintConfig],
  ignorePatterns: [
    '**/generators/**/templates/**',
    '**/dist/**',
    '**/node_modules/**',
    'examples/**',
    '.turbo/**',
    '.pnpm-store/**',
    '**/build/**',
    '**/coverage/**',
    '**/logs/**',
    '**/temp/**',
    '**/tmp/**',
    'packages/code-morph/src/morphers/tests/**',
    'packages/sync/src/output/string-merge-algorithms/tests/**',
  ],
});
