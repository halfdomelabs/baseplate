import fs from 'node:fs/promises';

/**
 * Checks if a path exists
 * @param fullPath - The path to check
 * @returns Whether the path exists
 */
export async function pathExists(fullPath: string): Promise<boolean> {
  return fs
    .access(fullPath)
    .then(() => true)
    .catch(() => false);
}

/**
 * Checks if a file exists
 * @param filePath - The path to the file
 * @returns Whether the file exists
 */
export async function fileExists(filePath: string): Promise<boolean> {
  return fs
    .stat(filePath)
    .then((file) => file.isFile())
    .catch(() => false);
}

/**
 * Ensures a directory exists, creating it recursively if it doesn't
 * @param directoryPath - The path to the directory
 */
export async function ensureDir(directoryPath: string): Promise<void> {
  await fs.mkdir(directoryPath, { recursive: true });
}
