import {
  TEMPLATES_INFO_FILENAME,
  templatesInfoFileSchema,
} from '@baseplate-dev/sync';
import {
  handleFileNotFoundError,
  readJsonWithSchema,
  writeStablePrettyJson,
} from '@baseplate-dev/utils/node';
import { omit } from 'es-toolkit';
import * as fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Creates or updates a .templates-info.json file
 */
export async function updateTemplateMetadata(
  filePath: string,
  generator: string,
  templateName: string,
  instanceData: Record<string, unknown> = {},
): Promise<void> {
  const dirPath = path.dirname(filePath);
  const metadataPath = path.join(dirPath, TEMPLATES_INFO_FILENAME);
  const fileName = path.basename(filePath);

  const existingMetadata = await readJsonWithSchema(
    metadataPath,
    templatesInfoFileSchema,
  ).catch(handleFileNotFoundError);

  const metadata = existingMetadata ?? {};

  metadata[fileName] = {
    template: templateName,
    generator,
    instanceData,
  };

  // Write the metadata back to the file
  await writeStablePrettyJson(metadataPath, metadata);
}

/**
 * Removes a file's metadata entry from the .templates-info.json file
 */
export async function removeTemplateMetadata(filePath: string): Promise<void> {
  const dirPath = path.dirname(filePath);
  const metadataPath = path.join(dirPath, TEMPLATES_INFO_FILENAME);
  const fileName = path.basename(filePath);

  const existingMetadata = await readJsonWithSchema(
    metadataPath,
    templatesInfoFileSchema,
  ).catch(handleFileNotFoundError);

  if (!existingMetadata) {
    return;
  }

  // Remove the file entry from metadata
  const updatedMetadata = omit(existingMetadata, [fileName]);

  // If no entries remain, delete the metadata file entirely, otherwise write updated metadata
  await (Object.keys(updatedMetadata).length === 0
    ? fs.unlink(metadataPath)
    : writeStablePrettyJson(metadataPath, updatedMetadata));
}
