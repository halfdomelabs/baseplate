import { createPatch } from 'diff';
import { mkdir, rm, writeFile } from 'node:fs/promises';
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
