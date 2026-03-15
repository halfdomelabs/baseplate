#!/usr/bin/env node

/**
 * Creates a single combined GitHub release for all published packages.
 *
 * Suppresses the default per-package git tags created by `changeset publish`
 * (via --no-git-tag) and instead creates a single annotated tag of the form
 * `baseplate@{version}` pointing at HEAD, then creates one GitHub release with
 * an aggregated changelog body.
 *
 * Change entries are deduplicated across packages (the same PR commonly appears
 * in multiple CHANGELOGs) and grouped by the highest change type seen for that
 * entry: Major > Minor > Patch.
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

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PublishedPackage {
  name: string;
  version: string;
}

interface WorkspacePackage {
  name: string;
  dir: string;
}

type ChangeType = 'major' | 'minor' | 'patch';

interface ChangeEntry {
  /** Raw markdown bullet text (may be multi-line, without the leading "- ") */
  text: string;
  type: ChangeType;
}

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------

const { values } = parseArgs({
  options: {
    'dry-run': { type: 'boolean', default: false },
    version: { type: 'string' },
  },
});

const isDryRun = values['dry-run'];

// ---------------------------------------------------------------------------
// Workspace discovery
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// CHANGELOG parsing
// ---------------------------------------------------------------------------

const CHANGE_TYPE_HEADINGS: Record<string, ChangeType> = {
  'Major Changes': 'major',
  'Minor Changes': 'minor',
  'Patch Changes': 'patch',
};

/**
 * Parses all change entries from a package's CHANGELOG section for a given
 * version. Returns an array of {text, type} — one per bullet, excluding
 * "Updated dependencies" bullets.
 *
 * A "bullet" is the leading "- " line plus any subsequent lines that are
 * indented (continuation of the same list item).
 */
function parseChangeEntries(
  changelogContent: string,
  version: string,
): ChangeEntry[] {
  const lines = changelogContent.split('\n');

  // Find the heading line for this version
  const startIdx = lines.indexOf(`## ${version}`);
  if (startIdx === -1) {
    return [];
  }

  // Find the next version heading (or end of file)
  const endIdx = lines.findIndex(
    (line, idx) => idx > startIdx && line.startsWith('## '),
  );
  const sectionLines =
    endIdx === -1
      ? lines.slice(startIdx + 1)
      : lines.slice(startIdx + 1, endIdx);

  const entries: ChangeEntry[] = [];
  let currentType: ChangeType = 'patch';
  let currentBulletLines: string[] | null = null;

  function flushBullet(): void {
    if (!currentBulletLines) return;
    const text = currentBulletLines.join('\n').trimEnd();
    if (text) {
      entries.push({ text, type: currentType });
    }
    currentBulletLines = null;
  }

  for (const line of sectionLines) {
    // Detect change type subheadings (### Major Changes, etc.)
    if (line.startsWith('### ')) {
      flushBullet();
      const heading = line.slice(4).trim();
      currentType = CHANGE_TYPE_HEADINGS[heading] ?? 'patch';
      continue;
    }

    // Start of a new bullet
    if (line.startsWith('- ')) {
      flushBullet();
      const bulletText = line.slice(2);
      // Skip "Updated dependencies" bullets entirely
      if (bulletText.startsWith('Updated dependencies')) {
        currentBulletLines = null;
        continue;
      }
      currentBulletLines = [bulletText];
      continue;
    }

    // Continuation lines of the current bullet (indented or blank within item)
    if (currentBulletLines !== null) {
      // A blank line or indented line continues the bullet;
      // a non-indented, non-blank line ends it (shouldn't normally occur mid-bullet)
      if (line === '' || line.startsWith(' ') || line.startsWith('\t')) {
        currentBulletLines.push(line);
      } else {
        flushBullet();
      }
    }
  }

  flushBullet();
  return entries;
}

// ---------------------------------------------------------------------------
// Deduplication & aggregation
// ---------------------------------------------------------------------------

const CHANGE_TYPE_RANK: Record<ChangeType, number> = {
  major: 3,
  minor: 2,
  patch: 1,
};

/**
 * Merges change entries from all packages. Entries with identical text are
 * deduplicated; when the same entry appears under different change types, the
 * highest-ranked type wins (Major > Minor > Patch).
 */
function mergeEntries(allEntries: ChangeEntry[]): ChangeEntry[] {
  // Use the full bullet text as the dedup key
  const seen = new Map<string, ChangeEntry>();

  for (const entry of allEntries) {
    const existing = seen.get(entry.text);
    if (!existing) {
      seen.set(entry.text, { ...entry });
    } else if (CHANGE_TYPE_RANK[entry.type] > CHANGE_TYPE_RANK[existing.type]) {
      existing.type = entry.type;
    }
  }

  return [...seen.values()];
}

// ---------------------------------------------------------------------------
// Release body rendering
// ---------------------------------------------------------------------------

function buildReleaseBody(entries: ChangeEntry[]): string {
  const byType: Record<ChangeType, string[]> = {
    major: [],
    minor: [],
    patch: [],
  };

  for (const entry of entries) {
    // Re-add the leading "- " stripped during parsing
    byType[entry.type].push(`- ${entry.text}`);
  }

  const sections: string[] = [];

  if (byType.major.length > 0) {
    sections.push(`### Major Changes\n\n${byType.major.join('\n\n')}`);
  }
  if (byType.minor.length > 0) {
    sections.push(`### Minor Changes\n\n${byType.minor.join('\n\n')}`);
  }
  if (byType.patch.length > 0) {
    sections.push(`### Patch Changes\n\n${byType.patch.join('\n\n')}`);
  }

  return sections.join('\n\n');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

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

  // Collect and merge change entries across all workspace packages
  const packages = await getWorkspacePackages();
  console.info(
    `Scanning ${packages.length} workspace packages for changelog entries…`,
  );

  const allEntries: ChangeEntry[] = [];

  for (const pkg of packages) {
    const changelogPath = path.join(pkg.dir, 'CHANGELOG.md');

    let changelogContent: string;
    try {
      changelogContent = await fs.readFile(changelogPath, 'utf8');
    } catch {
      continue; // No CHANGELOG — skip silently
    }

    const entries = parseChangeEntries(changelogContent, version);
    allEntries.push(...entries);
  }

  const mergedEntries = mergeEntries(allEntries);

  if (mergedEntries.length === 0) {
    console.warn(
      `Warning: no changelog entries found for version ${version}. The release body will be empty.`,
    );
  }

  const releaseBody = buildReleaseBody(mergedEntries);

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
