#!/usr/bin/env node

/**
 * Pre-publish registry check — verifies that every publishable npm package in
 * the workspace already exists on the npm registry.
 *
 * Scoped packages (@foo/bar) default to "restricted" access on their very
 * first publish, so new packages must be published manually once before the
 * automated release workflow can take over.  This script detects any packages
 * that have never been published and fails loudly so the release is blocked
 * before a partial publish can occur.
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';

interface PackageJson {
  name: string;
  private?: boolean;
  [key: string]: unknown;
}

interface WorkspacePackage {
  name: string;
  path: string;
  packageJson: PackageJson;
}

/**
 * Discovers all non-private packages in the workspace by scanning every
 * package.json under `packages/` and `plugins/`.
 */
async function getPublishablePackages(): Promise<WorkspacePackage[]> {
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
      const packageJsonPath = path.join(searchPath, entry, 'package.json');
      try {
        const content = await fs.readFile(packageJsonPath, 'utf8');
        const packageJson = JSON.parse(content) as PackageJson;

        if (packageJson.private === true || !packageJson.name) {
          continue;
        }

        results.push({
          name: packageJson.name,
          path: path.join(searchPath, entry),
          packageJson,
        });
      } catch {
        // No package.json or unreadable — skip
      }
    }
  }

  return results;
}

/**
 * Returns true if the package exists on the npm registry (any version).
 * Uses the abbreviated registry endpoint for speed.
 */
async function existsOnRegistry(packageName: string): Promise<boolean> {
  const encodedName = packageName.replace('/', '%2F');
  const url = `https://registry.npmjs.org/${encodedName}`;

  const response = await fetch(url, { method: 'HEAD' });

  if (response.status === 200) {
    return true;
  }
  if (response.status === 404) {
    return false;
  }

  throw new Error(
    `Unexpected status ${response.status} from registry for ${packageName}`,
  );
}

async function checkNpmRegistry(): Promise<void> {
  console.info('Checking publishable packages against the npm registry…');

  const packages = await getPublishablePackages();
  console.info(`Found ${packages.length} publishable packages to check.`);

  const results = await Promise.all(
    packages.map(async (pkg) => ({
      name: pkg.name,
      exists: await existsOnRegistry(pkg.name),
    })),
  );

  const missing = results.filter((r) => !r.exists);

  if (missing.length === 0) {
    console.info('All packages exist on the npm registry. ✓');
    return;
  }

  console.error(
    `\nError: The following ${missing.length} package(s) have never been published to npm:`,
  );
  for (const pkg of missing) {
    console.error(`  • ${pkg.name}`);
  }
  console.error(
    '\nThe OIDC Trusted Publishing flow cannot publish a package that does not yet',
  );
  console.error(
    'exist on npm — the npmjs.com UI requires the package to exist before OIDC',
  );
  console.error(
    'settings can be configured (see https://github.com/npm/cli/issues/8544).',
  );
  console.error(
    '\nBootstrap each missing package manually, then re-run the release workflow:',
  );
  console.error('\n  node scripts/setup-baseplate-package.ts <package-name>');

  process.exit(1);
}

await checkNpmRegistry().catch((error: unknown) => {
  console.error('Registry check failed unexpectedly:', error);
  process.exit(1);
});
