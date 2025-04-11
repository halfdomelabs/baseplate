import { mapGroupBy } from '@halfdomelabs/utils';
import {
  handleFileNotFoundError,
  readJsonWithSchema,
} from '@halfdomelabs/utils/node';
import { omit, orderBy, uniqBy } from 'es-toolkit';
import { globby } from 'globby';
import fsAdapter from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';

import type { Logger } from '@src/utils/evented-logger.js';

import type {
  TemplateFileExtractorCreator,
  TemplateFileExtractorGeneratorInfo,
} from './template-file-extractor.js';

import { TEMPLATE_METADATA_FILENAME } from '../constants.js';
import { templateFileMetadataBaseSchema } from '../metadata/metadata.js';
import { createGeneratorInfoMap } from './create-generator-info-map.js';

/**
 * Run the template file extractors on a target output directory
 *
 * @param extractors - The template file extractors to run
 * @param outputDirectories - The output directories to run the extractors on
 * @param generatorPackageMap - The map of package names with generators to package paths
 */
export async function runTemplateFileExtractors(
  extractorCreators: TemplateFileExtractorCreator[],
  outputDirectories: string[],
  generatorPackageMap: Map<string, string>,
  logger: Logger,
): Promise<void> {
  // read generator template metadata
  const generatorInfoMaps = await Promise.all(
    outputDirectories.map((outputDirectory) =>
      createGeneratorInfoMap(outputDirectory, generatorPackageMap),
    ),
  );
  const generatorInfoMap = new Map<
    string,
    TemplateFileExtractorGeneratorInfo
  >();
  for (const map of generatorInfoMaps) {
    for (const [key, value] of map.entries()) {
      if (map.has(key) && map.get(key)?.baseDirectory !== value.baseDirectory) {
        throw new Error(
          `Mismatched generator info found during merge: ${key}. Found both ${generatorInfoMap.get(key)?.baseDirectory} and ${value.baseDirectory}`,
        );
      }
      generatorInfoMap.set(key, value);
    }
  }
  const extractors = extractorCreators.map((creator) =>
    creator({
      generatorInfoMap,
      logger,
    }),
  );

  // Find all template metadata files
  const templateMetadataFiles = await globby(
    outputDirectories.map((outputDirectory) =>
      path.join(outputDirectory, '**', TEMPLATE_METADATA_FILENAME),
    ),
    {
      absolute: true,
      onlyFiles: true,
      fs: fsAdapter,
    },
  );

  // Process each metadata file
  const extractorFileArrays = await Promise.all(
    templateMetadataFiles.map(async (metadataFile) => {
      const metadataFileContents = await readJsonWithSchema(
        metadataFile,
        z.record(z.string(), templateFileMetadataBaseSchema.passthrough()),
      );
      return await Promise.all(
        Object.entries(metadataFileContents).map(
          async ([filename, metadata]) => {
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
  const extractorFiles = orderBy(
    extractorFileArrays.flat(),
    [(f) => f.modifiedTime],
    ['desc'],
  );

  const filesByType = mapGroupBy(extractorFiles, (m) => m.metadata.type);
  for (const [type, files] of filesByType) {
    const extractor = extractors.find((e) => e.name === type);
    if (!extractor) {
      throw new Error(`No extractor found for template type: ${type}`);
    }
    // make sure we only get the files that have been modified the latest for each generator/template file combo
    const uniqueTemplateFiles = uniqBy(files, (f) =>
      JSON.stringify({
        g: f.metadata.generator,
        t: f.metadata.template,
      }),
    );
    // check for duplicate names for the same generator
    const duplicateNames = uniqueTemplateFiles.filter(
      (f) =>
        uniqueTemplateFiles.filter(
          (f2) =>
            f2.metadata.generator === f.metadata.generator &&
            f2.metadata.name === f.metadata.name,
        ).length > 1,
    );
    if (duplicateNames.length > 0) {
      throw new Error(
        `Duplicate names found for the same generator: ${duplicateNames
          .map((f) => f.path)
          .join(', ')}`,
      );
    }

    await extractor.extractTemplateFiles(
      uniqueTemplateFiles.map((f) => omit(f, ['modifiedTime'])),
    );
  }
}
