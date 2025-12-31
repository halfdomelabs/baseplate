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
 * Represents a template entry in .templates-info.json where the referenced file no longer exists.
 */
export interface OrphanedTemplateEntry {
  /** Path where the file should have existed */
  absolutePath: string;
  /** Template/generator info from metadata */
  templateInfo: TemplateInfo;
  /** Path to the .templates-info.json file */
  metadataFilePath: string;
  /** Filename key in the metadata file */
  fileName: string;
}

/**
 * Result of reading template info files, including both valid entries and orphaned entries.
 */
export interface ReadTemplateInfoFilesResult {
  /** Valid template entries where the file exists */
  entries: TemplateMetadataFileEntry[];
  /** Orphaned entries where the file no longer exists */
  orphanedEntries: OrphanedTemplateEntry[];
}

/**
 * Reads all templates info files in the output directory and returns template metadata entries.
 *
 * @param outputDirectory - The directory to read templates info files from.
 * @param ignoreInstance - Optional ignore instance to filter out ignored paths
 * @returns An object containing valid entries and orphaned entries (where the file no longer exists).
 */
export async function readTemplateInfoFiles(
  outputDirectory: string,
  ignoreInstance?: ignore.Ignore,
): Promise<ReadTemplateInfoFilesResult> {
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

  // Filter out ignored paths
  const filteredTemplateInfoFiles = ignoreInstance
    ? templateInfoFiles.filter((filePath) => {
        const relativePath = path.relative(outputDirectory, filePath);
        return shouldIncludeFile(relativePath, ignoreInstance);
      })
    : templateInfoFiles;

  const entries: TemplateMetadataFileEntry[] = [];
  const orphanedEntries: OrphanedTemplateEntry[] = [];

  await Promise.all(
    filteredTemplateInfoFiles.map(async (infoFile) => {
      const infoFileContents = await readJsonWithSchema(
        infoFile,
        templatesInfoFileSchema,
      );
      await Promise.all(
        Object.entries(infoFileContents).map(
          async ([filename, templateInfo]) => {
            const filePath = path.join(path.dirname(infoFile), filename);
            const modifiedTime = await fs
              .stat(filePath)
              .then((stats) => stats.mtime)
              .catch(handleFileNotFoundError);

            if (modifiedTime) {
              entries.push({
                absolutePath: filePath,
                templateInfo,
                modifiedTime,
              });
            } else {
              // File no longer exists - this is an orphaned entry
              orphanedEntries.push({
                absolutePath: filePath,
                templateInfo,
                metadataFilePath: infoFile,
                fileName: filename,
              });
            }
          },
        ),
      );
    }),
  );

  return { entries, orphanedEntries };
}
