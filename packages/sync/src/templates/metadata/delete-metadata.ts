import { promises as fs } from 'node:fs';
import path from 'node:path';

import {
  GENERATOR_INFO_FILENAME,
  TEMPLATE_METADATA_FILENAME,
} from '../constants.js';

/**
 * Recursively deletes all template metadata files and the generator metadata file
 * from the specified directory and its subdirectories.
 *
 * @param directory - The directory to delete metadata files from
 * @returns Promise that resolves when all metadata files are deleted
 */
export async function deleteMetadataFiles(directory: string): Promise<void> {
  const entries = await fs.readdir(directory, { withFileTypes: true });

  // Delete generator metadata file if it exists
  const generatorMetadataPath = path.join(directory, GENERATOR_INFO_FILENAME);
  try {
    await fs.unlink(generatorMetadataPath);
  } catch {
    // Ignore if file doesn't exist
  }

  // Process each entry
  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      // Recursively process subdirectories
      await deleteMetadataFiles(fullPath);
    } else if (entry.name === TEMPLATE_METADATA_FILENAME) {
      // Delete template metadata file
      await fs.unlink(fullPath);
    }
  }
}
