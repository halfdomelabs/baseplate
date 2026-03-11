#!/usr/bin/env node
// @ts-check

/**
 * collect-bad-versions.js
 *
 * Queries npm for published versions of each affected package, applies
 * filtering rules to identify bad versions, and writes the results to
 * scripts/published-version-skip-list.json.
 *
 * Run: node scripts/version-fix/collect-bad-versions.js
 */

import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT_DIR = path.join(__dirname, '..', '..');
const OUTPUT_PATH = path.join(
  ROOT_DIR,
  'scripts',
  'published-version-skip-list.json',
);

/**
 * @typedef {Object} PackageConfig
 * @property {string} name - npm package name
 * @property {(version: string) => boolean} isBad - returns true if the version is bad
 */

/** @type {PackageConfig[]} */
const PACKAGES = [
  {
    name: '@baseplate-dev/plugin-auth',
    // Any version >= 1.0.0 was an accidental major bump
    isBad: (v) => semverMajor(v) >= 1,
  },
  {
    name: '@baseplate-dev/plugin-storage',
    isBad: (v) => semverMajor(v) >= 1,
  },
  {
    name: '@baseplate-dev/plugin-email',
    isBad: (v) => semverMajor(v) >= 1,
  },
  {
    name: '@baseplate-dev/plugin-queue',
    isBad: (v) => semverMajor(v) >= 1,
  },
  {
    name: '@baseplate-dev/plugin-rate-limit',
    isBad: (v) => semverMajor(v) >= 1,
  },
  {
    name: '@baseplate-dev/project-builder-common',
    // Bad: all versions from 0.2.0 onward, up to but not including the current @latest
    // (current @latest is determined dynamically and excluded separately)
    isBad: (v) => semverCompare(v, '0.2.0') >= 0,
  },
  {
    name: '@baseplate-dev/project-builder-cli',
    isBad: (v) => semverCompare(v, '0.2.0') >= 0,
  },
  {
    name: '@baseplate-dev/create-project',
    // Bad from 0.3.4 onward — that's when project-builder-cli was added as a dep
    isBad: (v) => semverCompare(v, '0.3.4') >= 0,
  },
];

/**
 * Parse the major version number from a semver string.
 * @param {string} version
 * @returns {number}
 */
function semverMajor(version) {
  return Number.parseInt(version.split('.')[0], 10);
}

/**
 * Compare two semver strings. Returns negative if a < b, 0 if equal, positive if a > b.
 * Simple numeric comparison per segment — sufficient for well-formed semver without prerelease.
 * @param {string} a
 * @param {string} b
 * @returns {number}
 */
function semverCompare(a, b) {
  const partsA = a.split('.').map(Number);
  const partsB = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    const diff = (partsA[i] ?? 0) - (partsB[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

/**
 * Fetch all published versions and the current @latest tag for a package from npm.
 * @param {string} packageName
 * @returns {{ versions: string[]; latest: string }}
 */
function fetchPackageInfo(packageName) {
  try {
    const output = execSync(
      `npm view ${packageName} versions dist-tags.latest --json`,
      { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] },
    );
    const parsed = JSON.parse(output.trim());
    // When fetching multiple fields, npm returns an object; single field returns the value directly
    const versions = Array.isArray(parsed.versions)
      ? parsed.versions
      : [parsed.versions];
    const latest = /** @type {string} */ (parsed['dist-tags.latest']);
    return { versions, latest };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes('E404')) {
      console.warn(`  ⚠️  Package not found: ${packageName}`);
      return { versions: [], latest: '' };
    }
    throw error;
  }
}

console.info('Collecting bad versions from npm...\n');

/** @type {Record<string, string[]>} */
const skipList = {};

for (const pkg of PACKAGES) {
  console.info(`Checking ${pkg.name}...`);
  const { versions: allVersions, latest } = fetchPackageInfo(pkg.name);

  // All bad versions except current @latest (which stays published until PR 2)
  const badVersions = allVersions.filter((v) => pkg.isBad(v) && v !== latest);

  // Sort for readability
  badVersions.sort((a, b) => semverCompare(a, b));

  skipList[pkg.name] = badVersions;

  console.info(`  Current @latest: ${latest}`);
  console.info(`  Bad versions to unpublish: ${badVersions.length}`);
  if (badVersions.length > 0) {
    console.info(`  Versions: ${badVersions.join(', ')}`);
  }
  console.info();
}

writeFileSync(OUTPUT_PATH, `${JSON.stringify(skipList, null, 2)}\n`);
console.info(`✅ Written to ${OUTPUT_PATH}`);
console.info('\nSummary:');
for (const [pkg, versions] of Object.entries(skipList)) {
  console.info(`  ${pkg}: ${versions.length} versions to unpublish`);
}
