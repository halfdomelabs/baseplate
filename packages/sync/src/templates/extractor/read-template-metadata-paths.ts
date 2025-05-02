import { readJsonWithSchema } from '@halfdomelabs/utils/node';
import { globby } from 'globby';
import fsAdapter from 'node:fs';
import path from 'node:path';
import { z } from 'zod';

import { TEMPLATE_METADATA_FILENAME } from '../constants.js';

/**
 * Finds all template metadata files in the output directory and returns an array of
 * relative paths for all template files referenced in the metadata.
 *
 * @param outputDirectory - The directory to search for template metadata files
 * @returns An array of relative paths for all template files
 */
export async function readTemplateMetadataPaths(
  outputDirectory: string,
): Promise<string[]> {
  // Find all template metadata files
  const templateMetadataFiles = await globby(
    path.join(outputDirectory, '**', TEMPLATE_METADATA_FILENAME),
    {
      absolute: true,
      onlyFiles: true,
      fs: fsAdapter,
    },
  );

  // Process each metadata file
  const results = await Promise.all(
    templateMetadataFiles.map(async (metadataFile) => {
      const metadataFileContents = await readJsonWithSchema(
        metadataFile,
        z.record(z.string(), z.unknown()),
      );

      return Object.keys(metadataFileContents).map((filename) => {
        const relativePath = path.relative(
          outputDirectory,
          path.join(path.dirname(metadataFile), filename),
        );
        return relativePath.replaceAll(path.sep, path.posix.sep);
      });
    }),
  );

  return results.flat();
}
