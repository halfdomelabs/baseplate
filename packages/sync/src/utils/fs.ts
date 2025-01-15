import fs from 'node:fs/promises';

/**
 * Checks if a file exists
 * @param filePath - The path to the file
 * @returns Whether the file exists
 */
export async function pathExists(filePath: string): Promise<boolean> {
  return fs
    .access(filePath)
    .then(() => true)
    .catch(() => false);
}

/**
 * Ensures a directory exists, creating it recursively if it doesn't
 * @param directoryPath - The path to the directory
 */
export async function ensureDir(directoryPath: string): Promise<void> {
  if (await pathExists(directoryPath)) {
    return;
  }
  await fs.mkdir(directoryPath, { recursive: true });
}
