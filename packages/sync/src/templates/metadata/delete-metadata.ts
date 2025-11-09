import type ignore from 'ignore';

import { promises as fs } from 'node:fs';
import path from 'node:path';

import { shouldIncludeFile } from '../../utils/ignore-patterns.js';
import { TEMPLATES_INFO_FILENAME } from '../constants.js';

/**
 * Recursively deletes all template metadata files and the generator metadata file
 * from the specified directory and its subdirectories.
 *
 * @param directory - The directory to delete metadata files from
 * @param ignoreInstance - Optional ignore instance to filter out ignored paths
 * @param baseDirectory - Base directory for calculating relative paths (used internally for recursion)
 * @returns Promise that resolves when all metadata files are deleted
 */
export async function deleteMetadataFiles(
  directory: string,
  ignoreInstance?: ignore.Ignore,
  baseDirectory: string = directory,
): Promise<void> {
  const entries = await fs.readdir(directory, { withFileTypes: true });

  // Process each entry
  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    const relativePath = path.relative(baseDirectory, fullPath);

    // Skip if path matches ignore patterns
    if (ignoreInstance && !shouldIncludeFile(relativePath, ignoreInstance)) {
      continue;
    }

    if (entry.isDirectory()) {
      // Recursively process subdirectories
      await deleteMetadataFiles(fullPath, ignoreInstance, baseDirectory);
    } else if (entry.name === TEMPLATES_INFO_FILENAME) {
      // Delete templates info file
      await fs.unlink(fullPath);
    }
  }
}
