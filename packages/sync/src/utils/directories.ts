import { promises as fs } from 'node:fs';
import path from 'node:path';

interface DirectoryOptions {
  ignoreFiles?: string[];
}

/**
 * Checks if a directory is empty, optionally ignoring specified files.
 *
 * @param dirPath - Path to the directory to check
 * @param options - Options including ignoreFiles array
 * @param options.ignoreFiles - Array of file names to ignore when determining if directory is empty
 * @returns Promise that resolves to true if directory is empty (or only contains ignored files), false otherwise
 *
 * @example
 * // Check if directory is empty, ignoring .gitkeep files
 * const isEmpty = await isDirectoryEmpty('/path/to/dir', { ignoreFiles: ['.gitkeep'] });
 */
export async function isDirectoryEmpty(
  dirPath: string,
  options: DirectoryOptions = {},
): Promise<boolean> {
  try {
    const files = await fs.readdir(dirPath);
    const { ignoreFiles = [] } = options;

    // Filter out ignored files
    const nonIgnoredFiles = files.filter((file) => !ignoreFiles.includes(file));
    return nonIgnoredFiles.length === 0;
  } catch {
    return false;
  }
}

/**
 * Removes empty ancestor directories starting from the parent directories of the given file paths.
 *
 * A directory is considered "empty" if it contains no files, or only contains files that are
 * specified in the ignoreFiles option. Directories that only contain ignored files will be
 * removed along with their ignored files.
 *
 * The function traverses up the directory tree from each file path's parent directory,
 * removing empty directories until it encounters:
 * - A directory that contains non-ignored files
 * - The specified stop directory
 * - The filesystem root
 *
 * @param filePaths - Array of file paths whose parent directories should be checked for removal
 * @param stopAt - Directory path to stop at (this directory will not be removed)
 * @param options - Options including ignoreFiles array
 * @param options.ignoreFiles - Array of file names to ignore when determining if directory is empty
 *
 * @example
 * // Remove empty directories after deleting files, ignoring .gitkeep files
 * await removeEmptyAncestorDirectories(
 *   ['/project/src/components/Button.tsx'],
 *   '/project',
 *   { ignoreFiles: ['.gitkeep'] }
 * );
 */
export async function removeEmptyAncestorDirectories(
  filePaths: string[],
  stopAt: string,
  options: DirectoryOptions = {},
): Promise<void> {
  // Get unique parent directories from the file paths
  const uniqueParentDirs = [
    ...new Set(filePaths.map((filePath) => path.dirname(filePath))),
  ];

  // Sort by path length in descending order to process deeper directories first
  const sortedParentDirs = uniqueParentDirs.sort((a, b) => b.length - a.length);

  // Process each directory
  for (const dir of sortedParentDirs) {
    let currentDir = dir;

    // Continue until we hit the stop directory or root
    while (
      currentDir !== stopAt &&
      currentDir !== path.parse(currentDir).root
    ) {
      try {
        if (await isDirectoryEmpty(currentDir, options)) {
          // Directory is empty (or only contains ignored files), remove it
          await fs.rm(currentDir, { recursive: true, force: true });
          currentDir = path.dirname(currentDir);
        } else {
          // Directory contains non-ignored files, stop here
          break;
        }
      } catch {
        break; // Stop on any error (e.g., permissions, non-existent directory)
      }
    }
  }
}
