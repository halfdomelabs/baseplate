import fs from 'node:fs/promises';
import path from 'node:path';

import { removeEmptyAncestorDirectories } from '#src/utils/directories.js';
import { pathExists } from '#src/utils/fs.js';

import type { PreviousGeneratedPayload } from './prepare-generator-files/types.js';

interface CleanDeletedFilesInput {
  /**
   * Directory where the files are written
   */
  outputDirectory: string;
  /**
   * Previous generated payload containing file mappings
   */
  previousGeneratedPayload: PreviousGeneratedPayload | undefined;
  /**
   * Current file ID to relative path map
   */
  currentFileIdToRelativePathMap: Map<string, string>;
}

interface CleanDeletedFilesResult {
  /**
   * Relative paths of files that were deleted
   */
  deletedRelativePaths: string[];
  /**
   * Relative paths of files pending deletion (modified from generated version)
   */
  relativePathsPendingDelete: string[];
}

/**
 * Clean up files that were deleted in the new version
 */
export async function cleanDeletedFiles({
  outputDirectory,
  previousGeneratedPayload,
  currentFileIdToRelativePathMap,
}: CleanDeletedFilesInput): Promise<CleanDeletedFilesResult> {
  if (!previousGeneratedPayload) {
    return {
      deletedRelativePaths: [],
      relativePathsPendingDelete: [],
    };
  }

  const deletedRelativePaths: string[] = [];
  const relativePathsPendingDelete: string[] = [];
  const renamedOrDeletedPaths: string[] = [];

  // Get set of current relative paths
  const currentRelativePaths = new Set(currentFileIdToRelativePathMap.values());

  // Check each previous file
  for (const [
    ,
    previousRelativePath,
  ] of previousGeneratedPayload.fileIdToRelativePathMap) {
    // Skip if file is in current version
    if (currentRelativePaths.has(previousRelativePath)) {
      continue;
    }

    const fullPath = path.join(outputDirectory, previousRelativePath);

    // Check if file doesn't exist (e.g. was renamed or deleted)
    if (!(await pathExists(fullPath))) {
      renamedOrDeletedPaths.push(previousRelativePath);
      continue;
    }

    // Compare with previous generated content
    const currentContent = await fs.readFile(fullPath);
    const previousGeneratedContent =
      await previousGeneratedPayload.fileReader.readFile(previousRelativePath);

    if (!previousGeneratedContent) {
      continue;
    }

    if (currentContent.equals(previousGeneratedContent)) {
      // File is identical to previous generated version, delete it
      await fs.unlink(fullPath);
      deletedRelativePaths.push(previousRelativePath);
    } else {
      // File was modified, mark for pending deletion
      relativePathsPendingDelete.push(previousRelativePath);
    }
  }

  // Remove empty ancestor directories for both deleted and renamed files
  await removeEmptyAncestorDirectories(
    [...deletedRelativePaths, ...renamedOrDeletedPaths].map((relativePath) =>
      path.join(outputDirectory, relativePath),
    ),
    outputDirectory,
    {
      ignoreFiles: ['.templates-info.json'],
    },
  );

  return {
    deletedRelativePaths,
    relativePathsPendingDelete,
  };
}
