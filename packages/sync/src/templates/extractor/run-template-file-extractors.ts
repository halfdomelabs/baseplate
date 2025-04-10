import { mapGroupBy } from '@halfdomelabs/utils';
import { readJsonWithSchema } from '@halfdomelabs/utils/node';
import { globby } from 'globby';
import fsAdapter from 'node:fs';
import path from 'node:path';
import { z } from 'zod';

import type { Logger } from '@src/utils/evented-logger.js';

import type {
  TemplateFileExtractorCreator,
  TemplateFileExtractorFile,
} from './template-file-extractor.js';

import { TEMPLATE_METADATA_FILENAME } from '../constants.js';
import { templateFileMetadataBaseSchema } from '../metadata/metadata.js';
import { createGeneratorInfoMap } from './create-generator-info-map.js';

/**
 * Run the template file extractors on a target output directory
 *
 * @param extractors - The template file extractors to run
 * @param outputDirectory - The output directory
 * @param generatorPackageMap - The map of package names with generators to package paths
 */
export async function runTemplateFileExtractors(
  extractorCreators: TemplateFileExtractorCreator[],
  outputDirectory: string,
  generatorPackageMap: Map<string, string>,
  logger: Logger,
): Promise<void> {
  // read generator template metadata
  const generatorInfoMap = await createGeneratorInfoMap(
    outputDirectory,
    generatorPackageMap,
  );
  const extractors = extractorCreators.map((creator) =>
    creator({
      outputDirectory,
      generatorInfoMap,
      logger,
    }),
  );

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
  const extractorFileArrays: TemplateFileExtractorFile[][] = await Promise.all(
    templateMetadataFiles.map(async (metadataFile) => {
      const metadataFileContents = await readJsonWithSchema(
        metadataFile,
        z.record(z.string(), templateFileMetadataBaseSchema.passthrough()),
      );
      return Object.entries(metadataFileContents).map(
        ([filename, metadata]) => ({
          path: path.join(path.dirname(metadataFile), filename),
          metadata,
        }),
      );
    }),
  );
  const extractorFiles = extractorFileArrays.flat();

  const filesByType = mapGroupBy(extractorFiles, (m) => m.metadata.type);
  for (const [type, files] of filesByType) {
    const extractor = extractors.find((e) => e.name === type);
    if (!extractor) {
      throw new Error(`No extractor found for template type: ${type}`);
    }
    await extractor.extractTemplateFiles(files);
  }
}
