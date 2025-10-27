import {
  handleFileNotFoundError,
  readJsonWithSchema,
} from '@baseplate-dev/utils/node';
import { globby } from 'globby';
import fsAdapter from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';

import type { TemplateInfo } from './metadata.js';

import { TEMPLATES_INFO_FILENAME } from '../constants.js';
import { templatesInfoFileSchema } from './metadata.js';

export interface TemplateMetadataFileEntry {
  absolutePath: string;
  templateInfo: TemplateInfo;
  modifiedTime: Date;
}

/**
 * Reads all templates info files in the output directory and returns an array of template metadata file entries.
 *
 * @param outputDirectory - The directory to read templates info files from.
 * @returns An array of template metadata file entries.
 */
export async function readTemplateInfoFiles(
  outputDirectory: string,
): Promise<TemplateMetadataFileEntry[]> {
  const templateInfoFiles = await globby(
    [
      path.posix.join('**', TEMPLATES_INFO_FILENAME),
      '!/apps/**',
      '!/packages/**',
    ],
    {
      absolute: true,
      onlyFiles: true,
      fs: fsAdapter,
      gitignore: true,
      cwd: outputDirectory,
    },
  );

  const templateFileArrays = await Promise.all(
    templateInfoFiles.flatMap(async (infoFile) => {
      const infoFileContents = await readJsonWithSchema(
        infoFile,
        templatesInfoFileSchema,
      );
      return await Promise.all(
        Object.entries(infoFileContents).map(
          async ([
            filename,
            templateInfo,
          ]): Promise<TemplateMetadataFileEntry> => {
            const filePath = path.join(path.dirname(infoFile), filename);
            const modifiedTime = await fs
              .stat(filePath)
              .then((stats) => stats.mtime)
              .catch(handleFileNotFoundError);
            if (!modifiedTime) {
              throw new Error(
                `Could not find source file (${filename}) specified in templates info file: ${infoFile}`,
              );
            }

            return {
              absolutePath: filePath,
              templateInfo,
              modifiedTime,
            };
          },
        ),
      );
    }),
  );
  return templateFileArrays.flat();
}
