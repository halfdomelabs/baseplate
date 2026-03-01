import { mkdir } from 'node:fs/promises';
import path from 'node:path';

import type { SnapshotDirectory } from './snapshot-types.js';

import {
  DEFAULT_SNAPSHOTS_DIR,
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
 * Resolves the snapshot path for a given project directory and app name.
 * If snapshotDir is provided, it is resolved as an absolute path or relative to projectDirectory.
 * Otherwise, defaults to `<projectDirectory>/baseplate/snapshots/<appName>/`.
 */
function resolveSnapshotPath(
  projectDirectory: string,
  appName: string,
  snapshotDir?: string,
): string {
  if (snapshotDir) {
    return path.resolve(projectDirectory, snapshotDir);
  }
  return path.join(projectDirectory, DEFAULT_SNAPSHOTS_DIR, appName);
}

/**
 * Creates the snapshot directory structure.
 * @param projectDirectory - The project root directory
 * @param appName - The app name within the project
 * @param snapshotDir - Optional custom snapshot directory (absolute or relative to projectDirectory)
 */
export async function createSnapshotDirectory(
  projectDirectory: string,
  appName: string,
  snapshotDir?: string,
): Promise<SnapshotDirectory> {
  const snapshotPath = resolveSnapshotPath(
    projectDirectory,
    appName,
    snapshotDir,
  );
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
 * Resolves the snapshot directory paths without creating them.
 * @param projectDirectory - The project root directory
 * @param appName - The app name within the project
 * @param options - Optional snapshot directory override
 */
export function resolveSnapshotDirectory(
  projectDirectory: string,
  appName: string,
  options: { snapshotDir?: string } = {},
): SnapshotDirectory {
  const snapshotPath = resolveSnapshotPath(
    projectDirectory,
    appName,
    options.snapshotDir,
  );
  const manifestPath = path.join(snapshotPath, MANIFEST_FILENAME);
  const diffsPath = path.join(snapshotPath, DIFFS_DIRNAME);

  return {
    path: snapshotPath,
    manifestPath,
    diffsPath,
  };
}
