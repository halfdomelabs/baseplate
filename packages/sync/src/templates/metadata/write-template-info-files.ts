import { compareStrings, stringifyPrettyStable } from '@baseplate-dev/utils';
import { promises as fs } from 'node:fs';
import path from 'node:path';

import type { FileData } from '#src/output/generator-task-output.js';

import type { TemplateInfo } from './metadata.js';

import { TEMPLATES_INFO_FILENAME } from '../constants.js';

type DirectoryMetadata = Record<string, TemplateInfo>;

/**
 * Groups files by their directory and collects their template infos
 */
function groupFilesByDirectory(
  files: Map<string, FileData>,
): Map<string, DirectoryMetadata> {
  const directoryMap = new Map<string, DirectoryMetadata>();

  for (const [filePath, fileData] of files) {
    if (!fileData.options?.templateInfo) {
      continue;
    }

    const dirPath = path.dirname(filePath);
    const fileName = path.basename(filePath);

    const existingTemplateInfoEntries = directoryMap.get(dirPath) ?? {};
    existingTemplateInfoEntries[fileName] = fileData.options.templateInfo;
    directoryMap.set(dirPath, existingTemplateInfoEntries);
  }

  return directoryMap;
}

/**
 * Writes templates info files to each directory containing files with template metadata
 *
 * @param files - Map of file paths to file data
 * @param outputDirectory - Base directory where files are being written
 * @returns Promise that resolves when all templates info files are written
 */
export async function writeTemplateInfoFiles(
  files: Map<string, FileData>,
  outputDirectory: string,
): Promise<void> {
  const directoryInfoMap = groupFilesByDirectory(files);

  const writePromises: Promise<void>[] = [];

  for (const [dirPath, info] of directoryInfoMap) {
    // Skip if no metadata to write
    if (Object.keys(info).length === 0) {
      continue;
    }

    const fullDirPath = path.join(outputDirectory, dirPath);
    const infoPath = path.join(fullDirPath, TEMPLATES_INFO_FILENAME);

    const sortedInfoEntries = Object.fromEntries(
      Object.entries(info).toSorted(([a], [b]) => compareStrings(a, b)),
    );

    // Ensure directory exists
    writePromises.push(
      fs
        .mkdir(fullDirPath, { recursive: true })
        .then(() =>
          fs.writeFile(
            infoPath,
            stringifyPrettyStable(sortedInfoEntries),
            'utf8',
          ),
        ),
    );
  }

  await Promise.all(writePromises);
}
