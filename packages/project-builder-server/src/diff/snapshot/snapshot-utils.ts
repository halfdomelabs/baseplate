import { mkdir } from 'node:fs/promises';
import path from 'node:path';

import type { SnapshotDirectory, SnapshotOptions } from './snapshot-types.js';

import {
  DEFAULT_SNAPSHOT_DIR,
  DIFFS_DIRNAME,
  MANIFEST_FILENAME,
} from './snapshot-types.js';

/**
 * Converts a file path to a safe filename for storing diffs
 * Example: "src/components/button.tsx" -> "src_components_button.tsx.diff"
 */
export function pathToSafeDiffFilename(filePath: string): string {
  return `${filePath.replaceAll(/[/\\]/g, '_')}.diff`;
}

/**
 * Converts a safe diff filename back to the original file path
 * Example: "src_components_button.tsx.diff" -> "src/components/button.tsx"
 */
export function safeDiffFilenameToPath(diffFilename: string): string {
  if (!diffFilename.endsWith('.diff')) {
    throw new Error(`Invalid diff filename: ${diffFilename}`);
  }
  return diffFilename.slice(0, -5).replaceAll('_', '/');
}

/**
 * Creates the snapshot directory structure
 */
export async function createSnapshotDirectory(
  baseDirectory: string,
  snapshotDir: string = DEFAULT_SNAPSHOT_DIR,
): Promise<SnapshotDirectory> {
  const snapshotPath = path.resolve(baseDirectory, snapshotDir);
  const manifestPath = path.join(snapshotPath, MANIFEST_FILENAME);
  const diffsPath = path.join(snapshotPath, DIFFS_DIRNAME);

  // Create the directories
  await mkdir(snapshotPath, { recursive: true });
  await mkdir(diffsPath, { recursive: true });

  return {
    path: snapshotPath,
    manifestPath,
    diffsPath,
  };
}

/**
 * Resolves the snapshot directory paths without creating them
 */
export function resolveSnapshotDirectory(
  baseDirectory: string,
  options: SnapshotOptions = {},
): SnapshotDirectory {
  const snapshotDirName = options.snapshotDir ?? DEFAULT_SNAPSHOT_DIR;
  const snapshotPath = path.resolve(baseDirectory, snapshotDirName);
  const manifestPath = path.join(snapshotPath, MANIFEST_FILENAME);
  const diffsPath = path.join(snapshotPath, DIFFS_DIRNAME);

  return {
    path: snapshotPath,
    manifestPath,
    diffsPath,
  };
}
