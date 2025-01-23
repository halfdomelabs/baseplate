import { stat } from 'node:fs/promises';

/**
 * Checks if a directory exists
 * @param filePath - The path to the directory
 * @returns True if the directory exists, false otherwise
 */
export async function dirExists(filePath: string): Promise<boolean> {
  return stat(filePath)
    .then((file) => file.isDirectory())
    .catch(() => false);
}
