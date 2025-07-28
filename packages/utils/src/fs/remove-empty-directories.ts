import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Recursively removes empty directories.
 */
export async function removeEmptyDirectories(directory: string): Promise<void> {
  const entries = await fs.readdir(directory, { withFileTypes: true });

  // Process subdirectories first
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const subdirectory = path.join(directory, entry.name);
      await removeEmptyDirectories(subdirectory);
    }
  }

  // Check if directory is now empty
  const remainingEntries = await fs.readdir(directory);
  if (remainingEntries.length === 0) {
    await fs.rm(directory, { recursive: true });
  }
}
