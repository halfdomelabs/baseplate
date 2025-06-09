import { groupBy, uniq } from 'es-toolkit';

import type { Logger } from '#src/utils/evented-logger.js';

import type { TemplateFileMetadataBase } from '../metadata/metadata.js';
import type {
  AnyTemplateFileExtractor,
  TemplateFileExtractorMetadataEntry,
} from './runner/template-file-extractor.js';

import { readTemplateMetadataFiles } from '../metadata/read-template-metadata-files.js';
import { TemplateExtractorConfigLookup } from './configs/template-extractor-config-lookup.js';
import { initializeTemplateExtractorPlugins } from './runner/initialize-template-extractor-plugins.js';
import { TemplateExtractorApi } from './runner/template-extractor-api.js';
import { TemplateExtractorContext } from './runner/template-extractor-context.js';
import { TemplateExtractorFileContainer } from './runner/template-extractor-file-container.js';
import { groupTemplateFilesByType } from './utils/group-template-files-by-type.js';
import { updateExtractorTemplateEntries } from './utils/update-extractor-template-entries.js';

/**
 * Run the template file extractors on a target output directory
 *
 * @param extractors - The template file extractors to run
 * @param outputDirectories - The output directories to run the extractors on
 * @param generatorPackageMap - The map of package names with generators to package paths
 */
export async function runTemplateFileExtractors(
  templateFileExtractors: AnyTemplateFileExtractor[],
  outputDirectory: string,
  generatorPackageMap: Map<string, string>,
  logger: Logger,
): Promise<void> {
  const configLookup = new TemplateExtractorConfigLookup(generatorPackageMap);
  await configLookup.initialize();

  // Initialize plugins
  const fileContainer = new TemplateExtractorFileContainer();
  const initializerContext = new TemplateExtractorContext({
    configLookup,
    logger,
    outputDirectory,
    plugins: new Map(),
    fileContainer,
  });
  const { hooks, pluginMap } = await initializeTemplateExtractorPlugins({
    templateExtractors: templateFileExtractors,
    context: initializerContext,
  });

  async function runHooks(hook: 'afterExtract' | 'afterWrite'): Promise<void> {
    for (const hookFn of hooks[hook]) {
      await hookFn();
    }
  }

  // Create the context for the extractors
  const context = new TemplateExtractorContext({
    configLookup,
    logger,
    outputDirectory,
    plugins: pluginMap,
    fileContainer,
  });

  const templateMetadataFiles =
    await readTemplateMetadataFiles(outputDirectory);

  // Group files by type and validate uniqueness (throws on duplicates)
  const filesByType = groupTemplateFilesByType(templateMetadataFiles);

  // Get the metadata entries for each file
  const metadataEntries: TemplateFileExtractorMetadataEntry[] = [];
  for (const [type, files] of Object.entries(filesByType)) {
    const extractor = templateFileExtractors.find((e) => e.name === type);
    if (!extractor) {
      throw new Error(`No extractor found for template type: ${type}`);
    }

    const parsedFiles = files.map((f) => {
      const { absolutePath: path, metadata } = f;
      return {
        absolutePath: path,
        metadata: extractor.outputTemplateMetadataSchema
          ? (extractor.outputTemplateMetadataSchema.parse(
              metadata,
            ) as TemplateFileMetadataBase)
          : metadata,
      };
    });

    const newEntries = await extractor.extractTemplateMetadataEntries(
      parsedFiles,
      context,
    );
    metadataEntries.push(...newEntries);
  }

  await runHooks('afterExtract');

  // Update extractor configurations with new template entries
  updateExtractorTemplateEntries(metadataEntries, context);

  // Group metadata entries by type
  const metadataEntriesByType = groupBy(
    metadataEntries,
    (e) => e.metadata.type,
  );

  for (const [type, entries] of Object.entries(metadataEntriesByType)) {
    const extractor = templateFileExtractors.find((e) => e.name === type);
    if (!extractor) {
      throw new Error(`No extractor found for template type: ${type}`);
    }

    const api = new TemplateExtractorApi(context, type);

    await extractor.writeTemplateFiles(entries, context, api);

    const generatorNames = uniq(entries.map((e) => e.generator));
    await extractor.writeGeneratedFiles(generatorNames, context, api);
  }

  await runHooks('afterWrite');

  // Commit the file changes once all the extractors and plugins have written their files

  await fileContainer.commit();
}
