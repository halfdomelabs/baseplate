import { existsSync } from 'node:fs';
import path from 'node:path';

/**
 * Find the nearest file in the directory tree. If a .git folder is found, it
 * will stop searching.
 *
 * @param startPath - The starting directory to search from.
 * @param filename - The name of the file to search for.
 * @returns The path to the nearest file, or undefined if no file is found.
 */
export function findNearestAncestorFile(
  startPath: string,
  filename: string,
): string | undefined {
  let currentPath = startPath;

  for (;;) {
    const filePath = path.join(currentPath, filename);
    const gitPath = path.join(currentPath, '.git');

    if (existsSync(filePath)) {
      return filePath;
    }

    // Stop searching if we find a .git folder
    if (existsSync(gitPath)) {
      return undefined;
    }

    const parentPath = path.dirname(currentPath);

    if (parentPath === currentPath) {
      // Reached the root directory without finding the file
      return undefined;
    }

    currentPath = parentPath;
  }
}
