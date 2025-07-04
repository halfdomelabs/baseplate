import { promises as fs } from 'node:fs';
import path from 'node:path';

interface DirectoryOptions {
  ignoreFiles?: string[];
}

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

export async function removeEmptyAncestorDirectories(
  filePaths: string[],
  stopAt: string,
  options: DirectoryOptions = {},
): Promise<void> {
  // Get unique parent directories from the file paths
  const uniqueParentDirs = [
    ...new Set(filePaths.map((filePath) => path.dirname(filePath))),
  ];
  const parsedDirs = new Set();

  // Process each directory
  for (const dir of uniqueParentDirs) {
    let currentDir = dir;

    // Continue until we hit the stop directory or root
    while (
      currentDir !== stopAt &&
      currentDir !== path.parse(currentDir).root &&
      !parsedDirs.has(currentDir)
    ) {
      parsedDirs.add(currentDir);
      try {
        if (await isDirectoryEmpty(currentDir, options)) {
          await fs.rm(currentDir, { recursive: true, force: true });
          currentDir = path.dirname(currentDir);
        } else {
          break; // Stop if directory is not empty
        }
      } catch {
        break; // Stop on any error (e.g., permissions, non-existent directory)
      }
    }
  }
}
