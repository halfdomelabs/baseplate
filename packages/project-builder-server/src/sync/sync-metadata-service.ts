import {
  handleFileNotFoundError,
  readJsonWithSchema,
  writeStablePrettyJson,
} from '@halfdomelabs/utils/node';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

import type { SyncMetadata } from './sync-metadata.js';

import { syncMetadataSchema } from './sync-metadata.js';

const SYNC_METADATA_PATH = path.join('baseplate', '.build', 'sync_result.json');

export async function readSyncMetadata(
  projectDirectory: string,
): Promise<SyncMetadata | undefined> {
  const syncMetadataPath = path.join(projectDirectory, SYNC_METADATA_PATH);
  const syncMetadata = await readJsonWithSchema(
    syncMetadataPath,
    syncMetadataSchema,
  ).catch(handleFileNotFoundError);

  return syncMetadata;
}

export async function writeSyncMetadata(
  projectDirectory: string,
  syncMetadata: SyncMetadata,
): Promise<void> {
  const syncMetadataPath = path.join(projectDirectory, SYNC_METADATA_PATH);
  await mkdir(path.dirname(syncMetadataPath), { recursive: true });
  await writeStablePrettyJson(syncMetadataPath, syncMetadata);
}
