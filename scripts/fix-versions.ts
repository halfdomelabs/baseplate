#!/usr/bin/env node

/**
 * fix-versions.ts
 *
 * Runs after `pnpm changeset version`. Reads scripts/published-version-skip-list.json
 * and for any @baseplate-dev/* package whose version matches a skipped version,
 * increments the patch to avoid attempting to publish an already-published version.
 *
 * Hooked into the changeset release action via root package.json:
 *   "version": "pnpm changeset version && node ./scripts/fix-versions.ts"
 *
 * REMOVE THIS SCRIPT (and the "version" script from package.json) once all
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

// Find all package.json files under packages/* and plugins/*
const packageJsonPaths: string[] = [];
for await (const p of glob(
  ['packages/*/package.json', 'plugins/*/package.json'],
  {
    cwd: ROOT_DIR,
  },
)) {
  packageJsonPaths.push(p);
}

// Sanity check: all workspace packages must be on the same version before we proceed.
// If they're not, the fixed versioning group isn't in effect yet — bail safely.
const packageVersions = new Map<string, string>();
for (const relPath of packageJsonPaths) {
  const absPath = path.join(ROOT_DIR, relPath);
  const pkg = JSON.parse(readFileSync(absPath, 'utf8')) as {
    name: string;
    version: string;
  };
  if (pkg.name && pkg.version) {
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

// changesets 2.x escalates a package to `major` when a peerDependency it declares
// gets a `minor` bump, and the `fixed` group then drags every package to that major
// (0.6.15 -> 1.0.0). Fixed upstream by changesets#2090, unreleased as of 3.0.0-next.
// This has shipped an unintended 1.0 before, so require an explicit opt-in.
// Runs after `changeset version`, which has already consumed the .changeset/*.md
// files and rewritten every package.json — hence the `git restore .` below.
const previousMajor = Number(
  process.env.npm_package_version?.split('.')[0] ?? Number.NaN,
);
const escalatedMajor =
  major !== undefined &&
  major > 0 &&
  (Number.isNaN(previousMajor) || major > previousMajor);

if (escalatedMajor && !process.env.BASEPLATE_ALLOW_MAJOR_RELEASE) {
  throw new Error(
    `fix-versions: refusing to release ${currentVersion} — this bump escalates to a new major.\n` +
      `  A 'minor' changeset in the fixed @baseplate-dev/* group bumps the whole group's major.\n` +
      `  \`changeset version\` has already rewritten this working tree, so recover with:\n` +
      `    1. git restore .   (restores the consumed .changeset/*.md files and versions)\n` +
      `    2. downgrade the 'minor' changesets in .changeset/ to 'patch'\n` +
      `    3. re-run the release\n` +
      `  To genuinely release a new major, re-run with BASEPLATE_ALLOW_MAJOR_RELEASE=1.`,
  );
}

let bumped = 0;

for (const relPath of packageJsonPaths) {
  const absPath = path.join(ROOT_DIR, relPath);
  const pkg = JSON.parse(readFileSync(absPath, 'utf8')) as {
    name: string;
    version: string;
  };
  const { name, version } = pkg;

  if (!name || !version) continue;

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
