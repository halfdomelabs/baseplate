/**
 * Snapshot creation functionality
 */

import type { GeneratorOutput } from '@baseplate-dev/sync';
import type ignore from 'ignore';

import { mkdir, rm } from 'node:fs/promises';

import type { SnapshotManifest } from './snapshot-types.js';

import { compareFiles } from '../diff-utils.js';
import { saveSnapshotDiffFile } from './snapshot-diff-utils.js';
import { saveSnapshotManifest } from './snapshot-manifest.js';
import { SNAPSHOT_VERSION } from './snapshot-types.js';
import {
  createSnapshotDirectory,
  pathToSafeDiffFilename,
} from './snapshot-utils.js';

interface SaveSnapshotOptions {
  ignoreInstance?: ignore.Ignore;
  snapshotDir?: string;
}

interface SaveSnapshotResult {
  /** Path to the created snapshot directory */
  snapshotPath: string;
  /** Number of files included in the snapshot */
  fileCount: {
    modified: number;
    added: number;
    deleted: number;
  };
}

/**
 * Creates a snapshot from the current diff state
 */
export async function saveSnapshot(
  directory: string,
  generatorOutput: GeneratorOutput,
  { ignoreInstance, snapshotDir }: SaveSnapshotOptions = {},
): Promise<SaveSnapshotResult> {
  // Get current diff state
  const diffSummary = await compareFiles(
    directory,
    generatorOutput,
    undefined,
    ignoreInstance,
  );

  // Create snapshot directory structure
  const snapshotDirectory = await createSnapshotDirectory(
    directory,
    snapshotDir,
  );

  // Create manifest
  const { diffs } = diffSummary;

  // For now, we ignore binary modifications
  const modifiedTextDiffs = diffs.filter(
    (diff) => diff.type === 'modified' && !diff.isBinary,
  );
  const manifest: SnapshotManifest = {
    version: SNAPSHOT_VERSION,
    files: {
      modified: modifiedTextDiffs.map((diff) => ({
        path: diff.path,
        diffFile: pathToSafeDiffFilename(diff.path),
      })),
      added: diffs
        .filter((diff) => diff.type === 'added')
        .map((diff) => diff.path),
      deleted: diffs
        .filter((diff) => diff.type === 'deleted')
        .map((diff) => diff.path),
    },
  };

  // Clear out existing diffs
  await rm(snapshotDirectory.diffsPath, { recursive: true });
  await mkdir(snapshotDirectory.diffsPath, { recursive: true });

  // Save diffs to diffs folder
  for (const diff of modifiedTextDiffs) {
    await saveSnapshotDiffFile(
      snapshotDirectory,
      diff.path,
      diff.generatedContent,
      diff.workingContent,
    );
  }

  // Save manifest
  await saveSnapshotManifest(snapshotDirectory, manifest);

  return {
    snapshotPath: snapshotDirectory.path,
    fileCount: {
      modified: manifest.files.modified.length,
      added: manifest.files.added.length,
      deleted: manifest.files.deleted.length,
    },
  };
}
