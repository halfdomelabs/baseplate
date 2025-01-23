import { mkdir } from 'node:fs/promises';

/**
 * Ensures a directory exists, creating it recursively if it doesn't
 * @param directoryPath - The path to the directory
 */
export async function ensureDir(directoryPath: string): Promise<void> {
  await mkdir(directoryPath, { recursive: true });
}
