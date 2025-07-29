/**
 * Types and interfaces for the structured directory snapshot system
 */

import { z } from 'zod';

import type { FileDiff } from '../types.js';

export interface SnapshotManifest {
  /** Version of the snapshot format */
  version: string;
  /** Categorized list of files in the snapshot */
  files: SnapshotFiles;
}

export interface SnapshotFiles {
  /** Files that were modified (have diffs stored) */
  modified: ModifiedFileEntry[];
  /** Files that were added (exist in generated but not working) */
  added: string[];
  /** Files that were deleted (exist in working but not generated) */
  deleted: string[];
}

export interface ModifiedFileEntry {
  /** Relative path to the file */
  path: string;
  /** Name of the diff file in the diffs/ directory */
  diffFile: string;
}

export interface SnapshotDirectory {
  /** Path to the snapshot directory */
  path: string;
  /** Path to the manifest.json file */
  manifestPath: string;
  /** Path to the diffs/ subdirectory */
  diffsPath: string;
}

export interface SnapshotOptions {
  /** Custom name for the snapshot directory (default: .baseplate-snapshot) */
  snapshotDir?: string;
  /** Whether to use strict comparison mode */
  strict?: boolean;
}

export interface SnapshotComparison {
  /** Files that have new differences not in the snapshot */
  newDifferences: FileDiff[];
  /** Files that match the expected snapshot */
  expectedDifferences: FileDiff[];
  /** Files that were expected in snapshot but are missing */
  missingExpected: string[];
}

export interface CompareSnapshotResult {
  /** Comparison results */
  comparison: SnapshotComparison;
  /** Whether the comparison passed (no new differences) */
  passed: boolean;
  /** Summary message describing the results */
  summary: string;
}

export interface ApplySnapshotResult {
  /** Number of patches successfully applied */
  appliedPatches: number;
  /** Number of patches that failed */
  failedPatches: number;
  /** Details of any failures */
  failures: PatchFailure[];
}

export interface PatchFailure {
  /** Path to the file that failed to patch */
  filePath: string;
  /** Error message describing the failure */
  error: string;
  /** The diff content that failed to apply */
  diffContent: string;
}

export const SNAPSHOT_VERSION = '1';
export const DEFAULT_SNAPSHOT_DIR = '.baseplate-snapshot';
export const MANIFEST_FILENAME = 'manifest.json';
export const DIFFS_DIRNAME = 'diffs';

// Zod schemas for validation
export const modifiedFileEntrySchema = z.object({
  path: z.string(),
  diffFile: z.string(),
});

export const snapshotFilesSchema = z.object({
  modified: z.array(modifiedFileEntrySchema),
  added: z.array(z.string()),
  deleted: z.array(z.string()),
});

export const snapshotManifestSchema = z.object({
  version: z.string(),
  files: snapshotFilesSchema,
});
