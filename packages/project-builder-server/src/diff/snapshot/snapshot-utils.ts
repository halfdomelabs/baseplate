import { mkdir } from 'node:fs/promises';
import path from 'node:path';

import type { SnapshotDirectory } from './snapshot-types.js';

import {
  DIFFS_DIRNAME,
  MANIFEST_FILENAME,
  SNAPSHOTS_DIRNAME,
} from './snapshot-types.js';

/**
 * Resolves the baseplate directory for a project.
 * Defaults to `<projectDirectory>/baseplate` when no explicit override is provided.
 */
export function resolveBaseplateDir(
  projectDirectory: string,
  baseplateDirectory?: string,
): string {
  return baseplateDirectory ?? path.join(projectDirectory, 'baseplate');
}

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
 * Resolves the snapshot path for a given baseplate directory and app name.
 * Computes `<baseplateDirectory>/snapshots/<appName>/`.
 */
function resolveSnapshotPath(
  baseplateDirectory: string,
  appName: string,
): string {
  return path.join(baseplateDirectory, SNAPSHOTS_DIRNAME, appName);
}

/**
 * Creates the snapshot directory structure.
 * @param baseplateDirectory - The baseplate directory (e.g. `<projectDir>/baseplate`)
 * @param appName - The app name within the project
 */
export async function createSnapshotDirectory(
  baseplateDirectory: string,
  appName: string,
): Promise<SnapshotDirectory> {
  const snapshotPath = resolveSnapshotPath(baseplateDirectory, appName);
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
 * @param baseplateDirectory - The baseplate directory (e.g. `<projectDir>/baseplate`)
 * @param appName - The app name within the project
 */
export function resolveSnapshotDirectory(
  baseplateDirectory: string,
  appName: string,
): SnapshotDirectory {
  const snapshotPath = resolveSnapshotPath(baseplateDirectory, appName);
  const manifestPath = path.join(snapshotPath, MANIFEST_FILENAME);
  const diffsPath = path.join(snapshotPath, DIFFS_DIRNAME);

  return {
    path: snapshotPath,
    manifestPath,
    diffsPath,
  };
}
