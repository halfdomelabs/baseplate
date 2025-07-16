import { promises as fs } from 'node:fs';
import path from 'node:path';

import { TEMPLATES_INFO_FILENAME } from '../constants.js';

/**
 * Recursively deletes all template metadata files and the generator metadata file
 * from the specified directory and its subdirectories.
 *
 * @param directory - The directory to delete metadata files from
 * @returns Promise that resolves when all metadata files are deleted
 */
export async function deleteMetadataFiles(directory: string): Promise<void> {
  const entries = await fs.readdir(directory, { withFileTypes: true });

  // Process each entry
  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      // Recursively process subdirectories
      await deleteMetadataFiles(fullPath);
    } else if (entry.name === TEMPLATES_INFO_FILENAME) {
      // Delete templates info file
      await fs.unlink(fullPath);
    }
  }
}
