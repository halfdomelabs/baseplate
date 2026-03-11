#!/usr/bin/env node
// @ts-check

/**
 * unpublish.js
 *
 * Reads scripts/published-version-skip-list.json and unpublishes each bad
 * version one at a time (excluding current @latest versions). For plugin
 * packages, also deletes git tags for versions >= 1.0.0.
 *
 * Run:
 *   node scripts/version-fix/unpublish.js --dry-run   # preview only
 *   node scripts/version-fix/unpublish.js              # execute
 *
 * IMPORTANT: Run collect-bad-versions.js first to generate the skip list.
 */

import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT_DIR = path.join(__dirname, '..', '..');
const SKIP_LIST_PATH = path.join(
  ROOT_DIR,
  'scripts',
  'published-version-skip-list.json',
);

const isDryRun = process.argv.includes('--dry-run');

if (isDryRun) {
  console.info('🔍 DRY RUN — no changes will be made\n');
}

if (!existsSync(SKIP_LIST_PATH)) {
  console.error(
    `❌ Skip list not found at ${SKIP_LIST_PATH}\nRun collect-bad-versions.js first.`,
  );
  process.exit(1);
}

// The skip list contains only bad non-@latest versions — collect-bad-versions.js
// already excludes @latest. Unpublish everything in the list.
/** @type {Record<string, string[]>} */
const skipList = JSON.parse(readFileSync(SKIP_LIST_PATH, 'utf8'));

// Plugin packages where git tags >= 1.0.0 should be deleted
const PLUGIN_PACKAGES = new Set([
  '@baseplate-dev/plugin-auth',
  '@baseplate-dev/plugin-storage',
  '@baseplate-dev/plugin-email',
  '@baseplate-dev/plugin-queue',
  '@baseplate-dev/plugin-rate-limit',
]);

// Process order: dependents before dependencies
const PACKAGE_ORDER = [
  '@baseplate-dev/create-project',
  '@baseplate-dev/project-builder-cli',
  '@baseplate-dev/project-builder-common',
  '@baseplate-dev/plugin-auth',
  '@baseplate-dev/plugin-storage',
  '@baseplate-dev/plugin-email',
  '@baseplate-dev/plugin-queue',
  '@baseplate-dev/plugin-rate-limit',
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
 * Run a shell command, returning stdout. Throws on non-zero exit.
 * @param {string} cmd
 * @returns {string}
 */
function run(cmd) {
  return execSync(cmd, {
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
  }).trim();
}

/**
 * Check whether a specific version is still published on npm.
 * @param {string} packageName
 * @param {string} version
 * @returns {boolean}
 */
function isVersionPublished(packageName, version) {
  try {
    run(`npm view ${packageName}@${version} version`);
    return true;
  } catch {
    return false;
  }
}

/**
 * Unpublish a specific package version from npm.
 * @param {string} packageName
 * @param {string} version
 * @returns {{ success: boolean; alreadyGone: boolean }}
 */
function unpublishVersion(packageName, version) {
  if (isDryRun) {
    console.info(`  [dry-run] npm unpublish ${packageName}@${version}`);
    return { success: true, alreadyGone: false };
  }

  try {
    run(`npm unpublish ${packageName}@${version}`);
  } catch {
    // unpublish exits non-zero if already gone — that's fine
  }

  // Verify the version is actually gone
  const stillPublished = isVersionPublished(packageName, version);
  if (stillPublished) {
    return { success: false, alreadyGone: false };
  }
  return { success: true, alreadyGone: false };
}

/**
 * Delete a git tag locally and from origin.
 * @param {string} tag
 */
function deleteGitTag(tag) {
  if (isDryRun) {
    console.info(
      `  [dry-run] git tag -d "${tag}" && git push origin --delete "${tag}"`,
    );
    return;
  }

  try {
    run(`git tag -d "${tag}"`);
    console.info(`    Deleted local tag: ${tag}`);
  } catch {
    // Tag may not exist locally
  }

  try {
    run(`git push origin --delete "${tag}"`);
    console.info(`    Deleted remote tag: ${tag}`);
  } catch {
    // Tag may not exist on remote
  }
}

let totalUnpublished = 0;
let totalFailed = 0;
let totalSkipped = 0;

for (const packageName of PACKAGE_ORDER) {
  const versions = skipList[packageName];
  if (!versions || versions.length === 0) {
    console.info(`${packageName}: no bad versions in skip list, skipping\n`);
    continue;
  }

  const isPlugin = PLUGIN_PACKAGES.has(packageName);

  console.info(`${packageName}`);
  console.info(`  Versions to unpublish: ${versions.length}`);

  for (const version of versions) {
    process.stdout.write(`  Unpublishing ${version}... `);

    if (!isDryRun && !isVersionPublished(packageName, version)) {
      console.info('already gone, skipping');
      totalSkipped++;
      continue;
    } else {
      console.info('');
    }

    const { success } = unpublishVersion(packageName, version);

    if (success) {
      if (!isDryRun) {
        console.info('✅ unpublished');
      }
      totalUnpublished++;

      // Delete git tag for plugin versions >= 1.0.0
      if (isPlugin && semverMajor(version) >= 1) {
        const tag = `${packageName}@${version}`;
        deleteGitTag(tag);
      }
    } else {
      console.info('❌ FAILED (still published after unpublish attempt)');
      console.warn(
        `    The npm 72-hour restriction may be blocking this. Contact support@npmjs.com.`,
      );
      totalFailed++;
    }
  }

  console.info();
}

console.info('─'.repeat(50));
if (isDryRun) {
  console.info(
    `DRY RUN complete. Would unpublish ${totalUnpublished + totalFailed} versions.`,
  );
} else {
  console.info(`Done.`);
  console.info(`  ✅ Unpublished: ${totalUnpublished}`);
  if (totalSkipped > 0) console.info(`  ⏭️  Already gone: ${totalSkipped}`);
  if (totalFailed > 0) {
    console.info(`  ❌ Failed: ${totalFailed}`);
    console.info(
      '\n⚠️  Some versions could not be unpublished (likely npm 72-hour restriction).',
    );
    console.info(
      '   Contact support@npmjs.com with the list of failed versions.',
    );
    process.exit(1);
  }
}
