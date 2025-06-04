import {
  handleFileNotFoundError,
  readJsonWithSchema,
} from '@baseplate-dev/utils/node';
import { globby } from 'globby';
import fsAdapter from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';

import type { TemplateFileMetadataBase } from './metadata.js';

import { TEMPLATE_METADATA_FILENAME } from '../constants.js';
import { templateFileMetadataBaseSchema } from './metadata.js';

export interface TemplateMetadataFileEntry {
  path: string;
  metadata: TemplateFileMetadataBase;
  modifiedTime: Date;
}

/**
 * Reads all template metadata files in the output directory and returns an array of template metadata file entries.
 *
 * @param outputDirectory - The directory to read template metadata files from.
 * @returns An array of template metadata file entries.
 */
export async function readTemplateMetadataFiles(
  outputDirectory: string,
): Promise<TemplateMetadataFileEntry[]> {
  const templateMetadataFiles = await globby(
    path.join(outputDirectory, '**', TEMPLATE_METADATA_FILENAME),
    {
      absolute: true,
      onlyFiles: true,
      fs: fsAdapter,
    },
  );

  const templateFileArrays = await Promise.all(
    templateMetadataFiles.flatMap(async (metadataFile) => {
      const metadataFileContents = await readJsonWithSchema(
        metadataFile,
        z.record(z.string(), templateFileMetadataBaseSchema.passthrough()),
      );
      return await Promise.all(
        Object.entries(metadataFileContents).map(
          async ([filename, metadata]): Promise<TemplateMetadataFileEntry> => {
            const filePath = path.join(path.dirname(metadataFile), filename);
            const modifiedTime = await fs
              .stat(filePath)
              .then((stats) => stats.mtime)
              .catch(handleFileNotFoundError);
            if (!modifiedTime) {
              throw new Error(
                `Could not find source file (${filename}) specified in metadata file: ${metadataFile}`,
              );
            }
            return {
              path: filePath,
              metadata,
              modifiedTime,
            };
          },
        ),
      );
    }),
  );
  return templateFileArrays.flat();
}
