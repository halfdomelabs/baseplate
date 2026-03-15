import oxlintConfigBase from '@baseplate-dev/tools/oxlint-config-base';
import { defineConfig } from 'oxlint';

export default defineConfig({
  extends: [oxlintConfigBase],
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
