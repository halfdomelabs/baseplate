import { findNearestPackageJson } from '@halfdomelabs/utils/node';
import { readFile } from 'node:fs/promises';

interface PackageJson {
  name: string;
  [key: string]: unknown;
}

/**
 * Cache of directory paths to their corresponding package names
 */
export type PackageNameCache = Map<string, string>;

/**
 * Finds the package name for a generator based on its directory
 * Uses a cache to avoid repeated filesystem lookups
 */
export async function findGeneratorPackageName(
  generatorDirectory: string,
  cache: PackageNameCache,
): Promise<string> {
  const cachedName = cache.get(generatorDirectory);
  if (cachedName) return cachedName;

  // Find the nearest package.json
  const packageJsonPath = await findNearestPackageJson({
    cwd: generatorDirectory,
  });
  if (!packageJsonPath) {
    throw new Error(
      `No package.json found for generator at ${generatorDirectory}`,
    );
  }

  try {
    // Read and parse the package.json
    const packageJsonContent = await readFile(packageJsonPath, 'utf8');
    const packageJson = JSON.parse(packageJsonContent) as PackageJson | null;

    const packageName =
      packageJson && typeof packageJson === 'object' && packageJson.name;

    if (!packageName) {
      throw new Error(`No package name found in ${packageJsonPath}`);
    }

    // Cache the result
    cache.set(generatorDirectory, packageName);

    return packageName;
  } catch (error) {
    throw new Error(
      `Failed to read or parse package.json at ${packageJsonPath}: ${String(error)}`,
    );
  }
}
