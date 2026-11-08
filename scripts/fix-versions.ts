#!/usr/bin/env node

/**
 * fix-versions.ts
 *
 * Runs after `changeset version` (via scripts/version-packages.ts). Reads
 * scripts/published-version-skip-list.json and for any @baseplate-dev/* package
 * whose version matches a skipped version, increments the patch to avoid
 * attempting to publish an already-published version. Only relevant once the
 * packages reach 1.0, where several versions were mis-published in the past.
 *
 * REMOVE THIS SCRIPT (and its call in scripts/version-packages.ts) once all
 * packages have been published past the last mis-published version.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { glob } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT_DIR = path.join(__dirname, '..');
const SKIP_LIST_PATH = path.join(
  ROOT_DIR,
  'scripts',
  'published-version-skip-list.json',
);

if (!existsSync(SKIP_LIST_PATH)) {
  console.info('fix-versions: skip list not found, nothing to do');
  process.exit(0);
}

const skipList = JSON.parse(readFileSync(SKIP_LIST_PATH, 'utf8')) as Record<
  string,
  string[]
>;

// Since all @baseplate-dev/* packages are in a unified fixed versioning group,
// a version is skippable if it appears in ANY package's skip list.
const allSkippedVersions = new Set(Object.values(skipList).flat());

/**
 * Increment the patch segment of a semver string.
 */
function incrementPatch(version: string): string {
  const parts = version.split('.');
  parts[2] = String(Number(parts[2]) + 1);
  return parts.join('.');
}

// Find all package.json files under packages/*
const packageJsonPaths: string[] = [];
for await (const p of glob(['packages/*/package.json'], {
  cwd: ROOT_DIR,
})) {
  packageJsonPaths.push(p);
}

// Sanity check: all published packages must be on the same version before we proceed.
// If they're not, the fixed versioning group isn't in effect yet — bail safely.
// Private packages are not versioned by changesets, so they are excluded.
const packageVersions = new Map<string, string>();
for (const relPath of packageJsonPaths) {
  const absPath = path.join(ROOT_DIR, relPath);
  const pkg = JSON.parse(readFileSync(absPath, 'utf8')) as {
    name: string;
    version: string;
    private?: boolean;
  };
  if (pkg.name && pkg.version && !pkg.private) {
    packageVersions.set(pkg.name, pkg.version);
  }
}

const uniqueVersions = new Set(packageVersions.values());
if (uniqueVersions.size > 1) {
  console.warn(
    'fix-versions: workspace packages are not all on the same version — skipping (unified fixed versioning not yet in effect)',
  );
  console.warn(`  Versions found: ${[...uniqueVersions].join(', ')}`);
  process.exit(0);
}

const currentVersion = [...uniqueVersions][0];
if (currentVersion === undefined) {
  console.warn('fix-versions: no workspace package versions found — skipping');
  process.exit(0);
}

const major = currentVersion.split('.').map(Number)[0];
if (major !== undefined && major > 1) {
  throw new Error(
    `fix-versions: major version is ${major} (> 1) — this script should have been removed by now. Current version: ${currentVersion}`,
  );
}

// Prerelease versions (e.g. 0.7.0-next.0) are never in the skip list.
if (currentVersion.includes('-')) {
  console.info(
    `fix-versions: ${currentVersion} is a prerelease, nothing to do`,
  );
  process.exit(0);
}

let bumped = 0;

for (const relPath of packageJsonPaths) {
  const absPath = path.join(ROOT_DIR, relPath);
  const pkg = JSON.parse(readFileSync(absPath, 'utf8')) as {
    name: string;
    version: string;
    private?: boolean;
  };
  const { name, version } = pkg;

  if (!name || !version || pkg.private) continue;

  if (!allSkippedVersions.has(version)) continue;

  let newVersion = incrementPatch(version);
  while (allSkippedVersions.has(newVersion)) {
    newVersion = incrementPatch(newVersion);
  }
  console.info(
    `fix-versions: bumping ${name} from ${version} to ${newVersion} (skipping already-published version)`,
  );

  pkg.version = newVersion;
  writeFileSync(absPath, `${JSON.stringify(pkg, null, 2)}\n`);

  // Also update the version heading in CHANGELOG.md if it exists
  const changelogPath = path.join(path.dirname(absPath), 'CHANGELOG.md');
  if (existsSync(changelogPath)) {
    const changelog = readFileSync(changelogPath, 'utf8');
    const updated = changelog.replace(
      `\n## ${version}\n`,
      `\n## ${newVersion}\n`,
    );
    if (updated !== changelog) {
      writeFileSync(changelogPath, updated);
      console.info(`fix-versions: updated CHANGELOG.md for ${name}`);
    }
  }

  bumped++;
}

if (bumped === 0) {
  console.info('fix-versions: no packages needed version adjustment');
} else {
  console.info(`fix-versions: bumped ${bumped} package(s)`);
}
