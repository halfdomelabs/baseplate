import { access } from 'node:fs/promises';

/**
 * Checks if a file exists.
 *
 * @param filePath - The path to the file.
 * @returns Whether the file exists.
 */
export async function pathExists(filePath: string): Promise<boolean> {
  return access(filePath)
    .then(() => true)
    .catch(() => false);
}
