import { stringifyPrettyStable } from '@baseplate-dev/utils';
import {
  handleFileNotFoundError,
  readJsonWithSchema,
} from '@baseplate-dev/utils/node';
import { writeFile } from 'node:fs/promises';

import type { SnapshotDirectory, SnapshotManifest } from './snapshot-types.js';

import { SNAPSHOT_VERSION, snapshotManifestSchema } from './snapshot-types.js';

/**
 * Creates a new snapshot manifest
 */
export function initializeSnapshotManifest(): SnapshotManifest {
  return {
    version: SNAPSHOT_VERSION,
    files: {
      modified: [],
      added: [],
      deleted: [],
    },
  };
}

/**
 * Saves a manifest to the snapshot directory
 */
export async function saveSnapshotManifest(
  snapshotDirectory: SnapshotDirectory,
  manifest: SnapshotManifest,
): Promise<void> {
  const sortedManifest = {
    version: manifest.version,
    files: {
      added: manifest.files.added.toSorted(),
      deleted: manifest.files.deleted.toSorted(),
      modified: manifest.files.modified.toSorted((a, b) =>
        a.path.localeCompare(b.path),
      ),
    },
  };
  const manifestContent = stringifyPrettyStable(sortedManifest);
  await writeFile(snapshotDirectory.manifestPath, manifestContent, 'utf8');
}

/**
 * Loads a manifest from the snapshot directory
 */
export async function loadSnapshotManifest(
  snapshotDirectory: SnapshotDirectory,
): Promise<SnapshotManifest | undefined> {
  const manifestData = await readJsonWithSchema(
    snapshotDirectory.manifestPath,
    snapshotManifestSchema,
  ).catch(handleFileNotFoundError);

  return manifestData;
}

/**
 * Adds a modified file entry to the manifest
 */
function addModifiedFile(
  manifest: SnapshotManifest,
  filePath: string,
  diffFile: string,
): SnapshotManifest {
  return {
    ...manifest,
    files: {
      ...manifest.files,
      modified: [
        ...manifest.files.modified.filter((entry) => entry.path !== filePath),
        { path: filePath, diffFile },
      ],
    },
  };
}

/**
 * Adds an added file to the manifest
 */
function addAddedFile(
  manifest: SnapshotManifest,
  filePath: string,
): SnapshotManifest {
  if (manifest.files.added.includes(filePath)) {
    return manifest;
  }

  return {
    ...manifest,
    files: {
      ...manifest.files,
      added: [...manifest.files.added, filePath],
    },
  };
}

/**
 * Adds a deleted file to the manifest
 */
function addDeletedFile(
  manifest: SnapshotManifest,
  filePath: string,
): SnapshotManifest {
  if (manifest.files.deleted.includes(filePath)) {
    return manifest;
  }

  return {
    ...manifest,
    files: {
      ...manifest.files,
      deleted: [...manifest.files.deleted, filePath],
    },
  };
}

/**
 * Removes a file from the manifest
 */
function removeFile(
  manifest: SnapshotManifest,
  filePath: string,
): SnapshotManifest {
  return {
    ...manifest,
    files: {
      ...manifest.files,
      modified: manifest.files.modified.filter(
        (entry) => entry.path !== filePath,
      ),
      added: manifest.files.added.filter((path) => path !== filePath),
      deleted: manifest.files.deleted.filter((path) => path !== filePath),
    },
  };
}

/**
 * Utilities for working with snapshot manifests
 */
export const snapshotManifestUtils = {
  // Immutable file operations (return new manifest)
  addModifiedFile,
  addAddedFile,
  addDeletedFile,
  removeFile,
};
