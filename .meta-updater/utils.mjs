import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Reads the package.json file from a directory
 * @param {string} dir - Directory path
 * @returns {Promise<object>} The package.json content or an empty object with name property
 */
export async function readPackageJson(dir) {
  try {
    const packageJsonPath = path.join(dir, 'package.json');
    const packageJsonContent = await fs.readFile(packageJsonPath, 'utf8');
    return JSON.parse(packageJsonContent);
  } catch (error) {
    return { name: '' };
  }
}

/**
 * Checks if a package depends on a specific dependency
 * @param {object} packageJson - The package.json content
 * @param {string} dependency - The dependency to check for
 * @returns {boolean} True if the dependency is found
 */
export function hasDependency(packageJson, dependency) {
  return !!(
    (packageJson.dependencies && packageJson.dependencies[dependency]) ||
    (packageJson.devDependencies && packageJson.devDependencies[dependency]) ||
    (packageJson.peerDependencies && packageJson.peerDependencies[dependency])
  );
}
