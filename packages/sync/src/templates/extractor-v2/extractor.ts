import { omit } from 'es-toolkit';

import type { Logger } from '#src/utils/evented-logger.js';

import type { TemplateFileExtractorCreator } from './template-file-extractor.js';

import { readTemplateMetadataFiles } from '../metadata/read-template-metadata-files.js';
import { TemplateExtractorConfigLookup } from './configs/template-extractor-config-lookup.js';
import { groupTemplateFilesByType } from './utils/group-template-files-by-type.js';

/**
 * Run the template file extractors on a target output directory
 *
 * @param extractors - The template file extractors to run
 * @param outputDirectories - The output directories to run the extractors on
 * @param generatorPackageMap - The map of package names with generators to package paths
 */
export async function runTemplateFileExtractors(
  extractorCreators: TemplateFileExtractorCreator[],
  outputDirectory: string,
  generatorPackageMap: Map<string, string>,
  logger: Logger,
): Promise<void> {
  const configLookup = new TemplateExtractorConfigLookup(generatorPackageMap);
  const extractors = extractorCreators.map((creator) =>
    creator({
      configLookup,
      logger,
      baseDirectory: outputDirectory,
    }),
  );

  const templateMetadataFiles =
    await readTemplateMetadataFiles(outputDirectory);

  // Group files by type and validate uniqueness (throws on duplicates)
  const filesByType = groupTemplateFilesByType(templateMetadataFiles);

  // Process each type group
  for (const [type, files] of Object.entries(filesByType)) {
    const extractor = extractors.find((e) => e.name === type);
    if (!extractor) {
      throw new Error(`No extractor found for template type: ${type}`);
    }

    await extractor.extractTemplateFiles(
      files.map((f) => omit(f, ['modifiedTime'])),
    );
  }
}
