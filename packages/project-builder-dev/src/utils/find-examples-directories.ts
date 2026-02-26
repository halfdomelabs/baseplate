import { dirExists } from '@baseplate-dev/utils/node';
import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Find all example directories by walking up from process.cwd() until an
 * `examples/` directory is found. Works in any repo (monorepo or plugin repo).
 *
 * @returns Array of absolute paths to example subdirectories
 * @throws Error if no examples directory is found
 */
export async function findExamplesDirectories(): Promise<string[]> {
  let dir = process.cwd();

  while (true) {
    const candidate = path.join(dir, 'examples');
    if (await dirExists(candidate)) {
      const entries = await fs.readdir(candidate, { withFileTypes: true });
      return entries
        .filter((e) => e.isDirectory())
        .map((e) => path.join(candidate, e.name));
    }
    const parent = path.dirname(dir);
    if (parent === dir) {
      throw new Error(
        `Could not find an examples/ directory walking up from ${process.cwd()}.`,
      );
    }
    dir = parent;
  }
}
