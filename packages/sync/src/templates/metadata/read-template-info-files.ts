import type ignore from 'ignore';

import {
  handleFileNotFoundError,
  readJsonWithSchema,
} from '@baseplate-dev/utils/node';
import { globby } from 'globby';
import fsAdapter from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';

import type { TemplateInfo } from './metadata.js';

import { shouldIncludeFile } from '../../utils/ignore-patterns.js';
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
 * @param ignoreInstance - Optional ignore instance to filter out ignored paths
 * @returns An array of template metadata file entries.
 */
export async function readTemplateInfoFiles(
  outputDirectory: string,
  ignoreInstance?: ignore.Ignore,
): Promise<TemplateMetadataFileEntry[]> {
  const templateInfoFiles = await globby(
    [path.join('**', TEMPLATES_INFO_FILENAME)],
    {
      absolute: true,
      onlyFiles: true,
      fs: fsAdapter,
      gitignore: true,
      cwd: outputDirectory,
    },
  );

  // Filter out ignored paths
  const filteredTemplateInfoFiles = ignoreInstance
    ? templateInfoFiles.filter((filePath) => {
        const relativePath = path.relative(outputDirectory, filePath);
        return shouldIncludeFile(relativePath, ignoreInstance);
      })
    : templateInfoFiles;

  const templateFileArrays = await Promise.all(
    filteredTemplateInfoFiles.flatMap(async (infoFile) => {
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
