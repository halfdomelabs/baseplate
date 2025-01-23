import { stat } from 'node:fs/promises';

/**
 * Checks if a file exists and is a file
 * @param filePath - The path to the file
 * @returns True if the file exists and is a file, false otherwise
 */
export async function fileExists(filePath: string): Promise<boolean> {
  return stat(filePath)
    .then((file) => file.isFile())
    .catch(() => false);
}
