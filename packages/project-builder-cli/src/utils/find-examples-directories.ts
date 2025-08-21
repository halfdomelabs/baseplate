import {
  findNearestPackageJson,
  handleFileNotFoundError,
} from '@baseplate-dev/utils/node';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Find all example directories in the Baseplate repository.
 *
 * This function locates the root of the Baseplate monorepo by finding the current
 * package's package.json, then navigating up to find the root package.json with
 * name "@baseplate-dev/root". It then looks for directories in the examples/ folder.
 *
 * @returns Array of absolute paths to example directories
 * @throws Error if root package.json cannot be found or verified
 */
export async function findExamplesDirectories(): Promise<string[]> {
  // Find current package.json (project-builder-cli)
  const currentPackageJson = await findNearestPackageJson({
    cwd: fileURLToPath(import.meta.url),
  });

  if (!currentPackageJson) {
    throw new Error(
      `Could not find current package.json of @baseplate-dev/project-builder-cli in ${fileURLToPath(import.meta.url)}`,
    );
  }

  // Go up one level and find root package.json
  const parentDir = path.dirname(path.dirname(currentPackageJson));
  const rootPackageJson = await findNearestPackageJson({
    cwd: parentDir,
  });

  if (!rootPackageJson) {
    throw new Error(
      `Could not find root package.json of @baseplate-dev/root in ${parentDir}. Make sure we are running inside the monorepo.`,
    );
  }

  // Verify it's the root package
  const packageContent = await fs.readFile(rootPackageJson, 'utf-8');
  const packageData = JSON.parse(packageContent) as { name?: string };

  if (packageData.name !== '@baseplate-dev/root') {
    throw new Error(
      `Found package.json is not the root package (found: ${packageData.name})`,
    );
  }

  // Look for examples directory
  const rootDir = path.dirname(rootPackageJson);
  const examplesDir = path.join(rootDir, 'examples');

  const entries = await fs
    .readdir(examplesDir, { withFileTypes: true })
    .catch(handleFileNotFoundError);
  if (!entries) {
    throw new Error(
      `Could not find examples directory in ${examplesDir}. Make sure the examples directory exists.`,
    );
  }
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(examplesDir, entry.name));
}
