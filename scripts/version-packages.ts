#!/usr/bin/env node

/**
 * Runs `changeset version` followed by `fix-versions.ts`.
 *
 * Changesets v3 exits with code 1 when there is nothing to release (e.g. only
 * changesets for private packages remain). That case is treated as a no-op so
 * the release workflow does not fail; any other error is propagated.
 */

import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT_DIR = path.join(fileURLToPath(new URL('.', import.meta.url)), '..');
const NOTHING_TO_RELEASE_MESSAGE = 'No unreleased changesets found';

const result = spawnSync('pnpm', ['changeset', 'version'], {
  cwd: ROOT_DIR,
  encoding: 'utf8',
  stdio: ['inherit', 'pipe', 'pipe'],
});

process.stdout.write(result.stdout);
process.stderr.write(result.stderr);

if (result.status !== 0) {
  const output = `${result.stdout}${result.stderr}`;
  if (output.includes(NOTHING_TO_RELEASE_MESSAGE)) {
    console.info('version-packages: nothing to release, skipping');
    process.exit(0);
  }
  process.exit(result.status ?? 1);
}

const fixVersions = spawnSync(
  'node',
  [path.join(ROOT_DIR, 'scripts', 'fix-versions.ts')],
  { cwd: ROOT_DIR, stdio: 'inherit' },
);
process.exit(fixVersions.status ?? 1);
