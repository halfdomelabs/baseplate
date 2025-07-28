import { handleFileNotFoundError } from '@baseplate-dev/utils/node';
import { createPatch } from 'diff';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

import type { SnapshotDirectory } from './snapshot-types.js';

import { pathToSafeDiffFilename } from './snapshot-utils.js';

/**
 * Creates and saves a diff file for a modified file
 */
export async function saveSnapshotDiffFile(
  snapshotDirectory: SnapshotDirectory,
  relativePath: string,
  generatedContent: string,
  workingContent: string,
): Promise<string> {
  const diffContent = createPatch(
    relativePath,
    generatedContent,
    workingContent,
  );
  const diffFileName = pathToSafeDiffFilename(relativePath);
  const diffFilePath = path.join(snapshotDirectory.diffsPath, diffFileName);

  await mkdir(path.dirname(diffFilePath), { recursive: true });
  await writeFile(diffFilePath, diffContent, 'utf8');

  return diffFileName;
}

export async function removeSnapshotDiffFile(
  snapshotDirectory: SnapshotDirectory,
  diffFileName: string,
): Promise<void> {
  const diffFilePath = path.join(snapshotDirectory.diffsPath, diffFileName);
  await rm(diffFilePath);
}

/**
 * Loads a diff file from the snapshot directory
 */
export async function loadDiffFile(
  snapshotDirectory: SnapshotDirectory,
  diffFileName: string,
): Promise<string> {
  const diffFilePath = path.join(snapshotDirectory.diffsPath, diffFileName);

  const diffContent = await readFile(diffFilePath, 'utf8').catch(
    handleFileNotFoundError,
  );
  if (!diffContent) {
    throw new Error(`Diff file not found: ${diffFileName}`);
  }
  return diffContent;
}
