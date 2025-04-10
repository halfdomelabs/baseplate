import { promises as fs } from 'node:fs';
import path from 'node:path';

import type { FileData } from '@src/output/generator-task-output.js';

import type { TemplateFileMetadataBase } from './metadata.js';

import { TEMPLATE_METADATA_FILENAME } from '../constants.js';

type DirectoryMetadata = Record<string, TemplateFileMetadataBase>;

/**
 * Groups files by their directory and collects their template metadata
 */
function groupFilesByDirectory(
  files: Map<string, FileData>,
): Map<string, DirectoryMetadata> {
  const directoryMap = new Map<string, DirectoryMetadata>();

  for (const [filePath, fileData] of files) {
    if (!fileData.options?.templateMetadata) {
      continue;
    }

    const dirPath = path.dirname(filePath);
    const fileName = path.basename(filePath);

    const existingMetadata = directoryMap.get(dirPath) ?? {};
    existingMetadata[fileName] = fileData.options.templateMetadata;
    directoryMap.set(dirPath, existingMetadata);
  }

  return directoryMap;
}

/**
 * Writes template metadata files to each directory containing files with metadata
 *
 * @param files - Map of file paths to file data
 * @param outputDirectory - Base directory where files are being written
 * @returns Promise that resolves when all metadata files are written
 */
export async function writeTemplateMetadata(
  files: Map<string, FileData>,
  outputDirectory: string,
): Promise<void> {
  const directoryMetadataMap = groupFilesByDirectory(files);

  const writePromises: Promise<void>[] = [];

  for (const [dirPath, metadata] of directoryMetadataMap) {
    // Skip if no metadata to write
    if (Object.keys(metadata).length === 0) {
      continue;
    }

    const fullDirPath = path.join(outputDirectory, dirPath);
    const metadataPath = path.join(fullDirPath, TEMPLATE_METADATA_FILENAME);

    const sortedMetadata = Object.fromEntries(
      Object.entries(metadata).sort(([a], [b]) => a.localeCompare(b)),
    );

    // Ensure directory exists
    writePromises.push(
      fs
        .mkdir(fullDirPath, { recursive: true })
        .then(() =>
          fs.writeFile(
            metadataPath,
            JSON.stringify(sortedMetadata, null, 2),
            'utf8',
          ),
        ),
    );
  }

  await Promise.all(writePromises);
}
