import { readFile } from 'node:fs/promises';

import { findNearestPackageJson } from './find-nearest-package-json.js';

/**
 * Reads the version field from the nearest package.json relative to the given directory.
 *
 * @param cwd - Directory to start searching from (pass `import.meta.dirname` for the current package)
 * @returns The version string, or null if no package.json was found or it has no version
 */
export async function getPackageVersion(cwd: string): Promise<string | null> {
  const packageJsonPath = await findNearestPackageJson({ cwd });
  if (!packageJsonPath) {
    return null;
  }
  const fileContent = await readFile(packageJsonPath, 'utf8');
  const packageJson = JSON.parse(fileContent) as { version?: unknown };
  return typeof packageJson.version === 'string' ? packageJson.version : null;
}
