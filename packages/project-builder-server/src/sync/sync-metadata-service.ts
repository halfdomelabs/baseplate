import {
  handleFileNotFoundError,
  readJsonWithSchema,
  writeStablePrettyJson,
} from '@halfdomelabs/utils/node';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

import type { SyncMetadata } from './sync-metadata.js';

import { INITIAL_SYNC_METADATA, syncMetadataSchema } from './sync-metadata.js';

/**
 * The path to the sync metadata file.
 */
export const SYNC_METADATA_PATH = path.join(
  'baseplate',
  '.build',
  'sync_result.json',
);

/**
 * Reads the sync metadata from the project directory.
 *
 * @param projectDirectory The directory of the project.
 * @returns The sync metadata or a default object if the file does not exist.
 */
export async function readSyncMetadata(
  projectDirectory: string,
): Promise<SyncMetadata> {
  const syncMetadataPath = path.join(projectDirectory, SYNC_METADATA_PATH);
  const syncMetadata = await readJsonWithSchema(
    syncMetadataPath,
    syncMetadataSchema,
  ).catch(handleFileNotFoundError);

  return syncMetadata ?? structuredClone(INITIAL_SYNC_METADATA);
}

/**
 * Writes the sync metadata to the project directory.
 *
 * @param projectDirectory The directory of the project.
 * @param syncMetadata The sync metadata to write.
 */
export async function writeSyncMetadata(
  projectDirectory: string,
  syncMetadata: SyncMetadata,
): Promise<void> {
  const syncMetadataPath = path.join(projectDirectory, SYNC_METADATA_PATH);
  await mkdir(path.dirname(syncMetadataPath), { recursive: true });
  await writeStablePrettyJson(syncMetadataPath, syncMetadata);
}
