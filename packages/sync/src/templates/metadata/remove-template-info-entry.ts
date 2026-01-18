import {
  handleFileNotFoundError,
  readJsonWithSchema,
  writeStablePrettyJson,
} from '@baseplate-dev/utils/node';
import { omit } from 'es-toolkit';
import fs from 'node:fs/promises';

import { templatesInfoFileSchema } from './metadata.js';

/**
 * Removes a single entry from a .templates-info.json file.
 * If the file becomes empty after removal, deletes the file entirely.
 *
 * @param metadataFilePath - Path to the .templates-info.json file
 * @param fileName - The filename key to remove from the metadata
 */
export async function removeTemplateInfoEntry(
  metadataFilePath: string,
  fileName: string,
): Promise<void> {
  const existingMetadata = await readJsonWithSchema(
    metadataFilePath,
    templatesInfoFileSchema,
  ).catch(handleFileNotFoundError);

  if (!existingMetadata) {
    // File doesn't exist, nothing to remove
    return;
  }

  // Remove the file entry from metadata
  const updatedMetadata = omit(existingMetadata, [fileName]);

  // If no entries remain, delete the metadata file entirely, otherwise write updated metadata
  await (Object.keys(updatedMetadata).length === 0
    ? fs.unlink(metadataFilePath)
    : writeStablePrettyJson(metadataFilePath, updatedMetadata));
}
