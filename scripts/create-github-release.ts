#!/usr/bin/env node

/**
 * Creates a single combined GitHub release for all published packages.
 *
 * Suppresses the default per-package git tags created by `changeset publish`
 * (via --no-git-tag) and instead creates a single annotated tag of the form
 * `baseplate@{version}` pointing at HEAD, then creates one GitHub release with
 * an aggregated changelog body.
 *
 * Usage:
 *   node ./scripts/create-github-release.ts [--dry-run] [--version <version>]
 *
 *   --dry-run           Print the tag and release body without creating anything
 *   --version <ver>     Specify the version directly (useful with --dry-run)
 *
 * In CI, pass the version via the PUBLISHED_PACKAGES env var (JSON array of
 * {name, version} objects from `steps.changesets.outputs.publishedPackages`).
 */

import { execFileSync } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';

interface PublishedPackage {
  name: string;
  version: string;
}

interface WorkspacePackage {
  name: string;
  dir: string;
}

const { values } = parseArgs({
  options: {
    'dry-run': { type: 'boolean', default: false },
    version: { type: 'string' },
  },
});

const isDryRun = values['dry-run'];

/**
 * Discovers all non-private packages in the workspace by scanning `packages/`
 * and `plugins/` top-level directories.
 */
async function getWorkspacePackages(): Promise<WorkspacePackage[]> {
  const rootDir = new URL('..', import.meta.url).pathname;
  const searchDirs = ['packages', 'plugins'];
  const results: WorkspacePackage[] = [];

  for (const searchDir of searchDirs) {
    const searchPath = path.join(rootDir, searchDir);

    let entries: string[];
    try {
      entries = await fs.readdir(searchPath);
    } catch {
      continue;
    }

    for (const entry of entries) {
      const dir = path.join(searchPath, entry);
      const packageJsonPath = path.join(dir, 'package.json');

      try {
        const content = await fs.readFile(packageJsonPath, 'utf8');
        const packageJson = JSON.parse(content) as {
          name?: string;
          private?: boolean;
        };

        if (packageJson.private === true || !packageJson.name) {
          continue;
        }

        results.push({ name: packageJson.name, dir });
      } catch {
        // No package.json or unreadable — skip
      }
    }
  }

  return results.toSorted((a, b) => a.name.localeCompare(b.name));
}

/**
 * Extracts the changelog section for a specific version from a CHANGELOG.md
 * file, filtering out "Updated dependencies" noise.
 *
 * Returns null if no section is found or if only dependency bumps remain.
 */
function extractChangelogSection(
  changelogContent: string,
  version: string,
): string | null {
  const lines = changelogContent.split('\n');

  // Find the heading line for this version
  const startIdx = lines.indexOf(`## ${version}`);
  if (startIdx === -1) {
    return null;
  }

  // Find the next version heading (or end of file)
  const endIdx = lines.findIndex(
    (line, idx) => idx > startIdx && line.startsWith('## '),
  );

  const sectionLines =
    endIdx === -1
      ? lines.slice(startIdx + 1)
      : lines.slice(startIdx + 1, endIdx);

  // Remove "Updated dependencies" block:
  // - a line matching /^- Updated dependencies/
  // - followed by indented sub-bullets (lines starting with "  -")
  const filtered: string[] = [];
  let skipIndented = false;

  for (const line of sectionLines) {
    if (line.startsWith('- Updated dependencies')) {
      skipIndented = true;
      continue;
    }
    if (skipIndented && line.startsWith('  -')) {
      continue;
    }
    skipIndented = false;
    filtered.push(line);
  }

  // Trim leading/trailing blank lines
  let start = 0;
  let end = filtered.length - 1;
  while (start <= end && filtered[start].trim() === '') start++;
  while (end >= start && filtered[end].trim() === '') end--;

  if (start > end) {
    return null;
  }

  return filtered.slice(start, end + 1).join('\n');
}

async function createGithubRelease(): Promise<void> {
  // Resolve version
  let { version } = values;

  if (!version) {
    const publishedPackagesEnv = process.env.PUBLISHED_PACKAGES;
    if (!publishedPackagesEnv) {
      console.error(
        'Error: provide --version or set the PUBLISHED_PACKAGES env var.',
      );
      process.exit(1);
    }

    const publishedPackages = JSON.parse(
      publishedPackagesEnv,
    ) as PublishedPackage[];
    if (publishedPackages.length === 0) {
      console.error('Error: PUBLISHED_PACKAGES is empty.');
      process.exit(1);
    }

    version = publishedPackages[0].version;
  }

  const tag = `baseplate@${version}`;
  console.info(`Preparing GitHub release for ${tag}…`);

  // Collect changelog sections from all workspace packages
  const packages = await getWorkspacePackages();
  console.info(
    `Scanning ${packages.length} workspace packages for changelog entries…`,
  );

  const sections: string[] = [];

  for (const pkg of packages) {
    const changelogPath = path.join(pkg.dir, 'CHANGELOG.md');

    let changelogContent: string;
    try {
      changelogContent = await fs.readFile(changelogPath, 'utf8');
    } catch {
      continue; // No CHANGELOG — skip silently
    }

    const section = extractChangelogSection(changelogContent, version);
    if (section) {
      sections.push(`## ${pkg.name}\n\n${section}`);
    }
  }

  if (sections.length === 0) {
    console.warn(
      `Warning: no changelog entries found for version ${version}. The release body will be empty.`,
    );
  }

  const releaseBody = sections.join('\n\n');

  if (isDryRun) {
    console.info('\n--- DRY RUN ---');
    console.info(`Tag:   ${tag}`);
    console.info(`Title: ${tag}`);
    console.info('\n--- Release Body ---\n');
    console.info(releaseBody || '(empty)');
    return;
  }

  // Create and push the single annotated tag
  console.info(`Creating git tag ${tag}…`);
  execFileSync('git', ['tag', '-a', tag, '-m', tag]);
  execFileSync('git', ['push', 'origin', tag]);

  // Create the GitHub release
  console.info(`Creating GitHub release ${tag}…`);
  execFileSync(
    'gh',
    ['release', 'create', tag, '--title', tag, '--notes-file', '-', '--latest'],
    {
      input: releaseBody,
      encoding: 'utf8',
      stdio: ['pipe', 'inherit', 'inherit'],
    },
  );

  console.info(`GitHub release ${tag} created successfully.`);
}

await createGithubRelease().catch((error: unknown) => {
  console.error('GitHub release creation failed:', error);
  process.exit(1);
});
