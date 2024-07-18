import path from 'path';

/**
 * Safely concatenate two paths and prevent directory traversal attacks.
 * @param {string} basePath - The base directory path.
 * @param {string} relativePath - The relative path to concatenate to the base path.
 * @returns {string} The safely concatenated and normalized absolute path.
 */
export function pathSafeJoin(
  basePath: string,
  relativePath: string,
): string | undefined {
  const normalizedBasePath = path.resolve(basePath);
  const combinedPath = path.join(normalizedBasePath, relativePath);

  // Ensure that the combined path is within the base path
  if (!combinedPath.startsWith(normalizedBasePath)) {
    return undefined;
  }

  return combinedPath;
}
