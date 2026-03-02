/**
 * Snapshot creation functionality
 */

import type { GeneratorOutput } from '@baseplate-dev/sync';
import type ignore from 'ignore';

import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

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
  /** Custom baseplate directory for snapshot storage. Defaults to `path.join(projectDirectory, 'baseplate')`. */
  baseplateDirectory?: string;
  /** When true, store full content of added files in the snapshot. Default: false. */
  includeAddedFileContents?: boolean;
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
 * Creates a snapshot from the current diff state.
 * @param appDirectory - The app directory to compare files against
 * @param projectDirectory - The project root directory
 * @param appName - The app name within the project
 * @param generatorOutput - The generated output to diff against
 * @param options - Optional snapshot options
 */
export async function saveSnapshot(
  appDirectory: string,
  projectDirectory: string,
  appName: string,
  generatorOutput: GeneratorOutput,
  {
    ignoreInstance,
    baseplateDirectory,
    includeAddedFileContents = false,
  }: SaveSnapshotOptions = {},
): Promise<SaveSnapshotResult> {
  const resolvedBaseplateDir =
    baseplateDirectory ?? path.join(projectDirectory, 'baseplate');

  // Get current diff state
  const diffSummary = await compareFiles(
    appDirectory,
    generatorOutput,
    undefined,
    ignoreInstance,
  );

  // Create snapshot directory structure
  const snapshotDirectory = await createSnapshotDirectory(
    resolvedBaseplateDir,
    appName,
  );

  // Create manifest
  const { diffs } = diffSummary;

  // For now, we ignore binary modifications
  const modifiedTextDiffs = diffs.filter(
    (diff) => diff.type === 'modified' && !diff.isBinary,
  );
  const addedTextDiffs = diffs.filter(
    (diff) => diff.type === 'added' && !diff.isBinary,
  );
  const manifest: SnapshotManifest = {
    version: SNAPSHOT_VERSION,
    files: {
      modified: modifiedTextDiffs.map((diff) => ({
        path: diff.path,
        diffFile: pathToSafeDiffFilename(diff.path),
      })),
      added: addedTextDiffs.map((diff) => ({
        path: diff.path,
        ...(includeAddedFileContents && {
          contentFile: pathToSafeDiffFilename(diff.path),
        }),
      })),
      deleted: diffs
        .filter((diff) => diff.type === 'deleted')
        .map((diff) => diff.path),
    },
  };

  // Clear out existing diffs
  await rm(snapshotDirectory.diffsPath, { recursive: true });
  await mkdir(snapshotDirectory.diffsPath, { recursive: true });

  // Save diffs for modified files
  for (const diff of modifiedTextDiffs) {
    await saveSnapshotDiffFile(
      snapshotDirectory,
      diff.path,
      diff.generatedContent,
      diff.workingContent,
    );
  }

  // Save full content for added files (only when content storage is enabled)
  if (includeAddedFileContents) {
    for (const diff of addedTextDiffs) {
      const contentFileName = pathToSafeDiffFilename(diff.path);
      const contentFilePath = path.join(
        snapshotDirectory.diffsPath,
        contentFileName,
      );
      await writeFile(contentFilePath, diff.workingContent, 'utf8');
    }
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
