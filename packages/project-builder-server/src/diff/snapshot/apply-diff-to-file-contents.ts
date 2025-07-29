import { handleFileNotFoundError } from '@baseplate-dev/utils/node';
import { applyPatch } from 'diff';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import type { SnapshotManifest } from './snapshot-types.js';

export async function applySnapshotToFileContents(
  relativePath: string,
  generatedContents: string | Buffer,
  snapshot: SnapshotManifest,
  diffDirectory: string,
): Promise<string | Buffer | undefined | false> {
  // If the file was purposely deleted, we skip the generation
  if (snapshot.files.deleted.includes(relativePath)) {
    return undefined;
  }

  // We do not support applying diffs to binary files
  if (Buffer.isBuffer(generatedContents)) {
    return generatedContents;
  }

  // Check for modified files
  const fileEntry = snapshot.files.modified.find(
    (file) => file.path === relativePath,
  );
  if (!fileEntry) {
    return generatedContents;
  }

  const diffFilePath = path.join(diffDirectory, fileEntry.diffFile);
  const diffFile = await readFile(diffFilePath, 'utf-8').catch(
    handleFileNotFoundError,
  );
  if (!diffFile) {
    throw new Error(`Diff file not found: ${diffFilePath}`);
  }

  return applyPatch(generatedContents, diffFile);
}
