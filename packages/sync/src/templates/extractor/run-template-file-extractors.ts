import { groupBy, uniq } from 'es-toolkit';

import type { Logger } from '#src/utils/evented-logger.js';

import type { TemplateExtractorHook } from './runner/template-extractor-plugin.js';
import type {
  AnyTemplateFileExtractor,
  TemplateFileExtractorMetadataEntry,
  TemplateFileExtractorSourceFile,
} from './runner/template-file-extractor.js';

import { readTemplateMetadataFiles } from '../metadata/read-template-metadata-files.js';
import { TemplateExtractorConfigLookup } from './configs/template-extractor-config-lookup.js';
import { tryCreateExtractorJson } from './configs/try-create-extractor-json.js';
import { initializeTemplateExtractorPlugins } from './runner/initialize-template-extractor-plugins.js';
import { TemplateExtractorApi } from './runner/template-extractor-api.js';
import { TemplateExtractorContext } from './runner/template-extractor-context.js';
import { TemplateExtractorFileContainer } from './runner/template-extractor-file-container.js';
import { cleanupUnusedTemplateFiles } from './utils/cleanup-unused-template-files.js';
import { mergeExtractorTemplateEntries } from './utils/merge-extractor-template-entries.js';
import { writeExtractorTemplateJsons } from './utils/write-extractor-template-jsons.js';

export interface RunTemplateFileExtractorsOptions {
  /**
   * Whether to auto-generate extractor.json files for generators that don't have one.
   */
  autoGenerateExtractor?: boolean;
  /**
   * Whether to skip cleaning the output directories (templates and generated).
   */
  skipClean?: boolean;
}

/**
 * Run the template file extractors on a target output directory
 *
 * @param extractors - The template file extractors to run
 * @param outputDirectories - The output directories to run the extractors on
 * @param generatorPackageMap - The map of package names with generators to package paths
 * @param logger - The logger to use
 * @param options - The options to use
 */
export async function runTemplateFileExtractors(
  templateFileExtractors: AnyTemplateFileExtractor[],
  outputDirectory: string,
  generatorPackageMap: Map<string, string>,
  logger: Logger,
  options?: RunTemplateFileExtractorsOptions,
): Promise<void> {
  const templateMetadataFiles =
    await readTemplateMetadataFiles(outputDirectory);

  const configLookup = new TemplateExtractorConfigLookup(generatorPackageMap);
  await configLookup.initialize();

  if (options?.autoGenerateExtractor) {
    const generatorNames = templateMetadataFiles.map(
      (m) => m.templateInfo.generator,
    );
    const missingGeneratorNames = generatorNames.filter(
      (name) => !configLookup.getExtractorConfig(name),
    );
    if (missingGeneratorNames.length > 0) {
      logger.info(
        `Auto-generating extractor.json files for ${missingGeneratorNames.length} generators: ${missingGeneratorNames.join(', ')}`,
      );
      for (const generatorName of missingGeneratorNames) {
        await tryCreateExtractorJson({
          packageMap: generatorPackageMap,
          generatorName,
        });
      }
      // Re-initialize the config lookup to pick up the new extractor.json files
      await configLookup.initialize();
    }
  }

  // Initialize plugins
  const fileContainer = new TemplateExtractorFileContainer([
    ...generatorPackageMap.values(),
  ]);
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

  async function runHooks(hook: TemplateExtractorHook): Promise<void> {
    for (const hookFn of hooks[hook].toReversed()) {
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

  // Group files by type (need to look up type from template definition)
  const filesWithTypeAndMetadata = templateMetadataFiles.map((file) => {
    const templateConfig = configLookup.getTemplateConfigOrThrow(
      file.templateInfo.generator,
      file.templateInfo.template,
    );
    return {
      ...file,
      templateType: templateConfig.type,
      metadata: templateConfig,
    };
  });

  const filesByType = groupBy(filesWithTypeAndMetadata, (f) => f.templateType);

  // Get the metadata entries for each file
  const metadataEntries: TemplateFileExtractorMetadataEntry[] = [];
  for (const [type, files] of Object.entries(filesByType)) {
    const extractor = templateFileExtractors.find((e) => e.name === type);
    if (!extractor) {
      throw new Error(`No extractor found for template type: ${type}`);
    }

    const parsedFiles = files
      // Only files with instanceData are extractable
      .filter((f) => f.templateInfo.instanceData !== undefined)
      .map((f) => {
        const { absolutePath: path, templateInfo, metadata, modifiedTime } = f;
        return {
          absolutePath: path,
          templateName: templateInfo.template,
          generatorName: templateInfo.generator,
          existingMetadata: metadata,
          instanceData: extractor.templateInstanceDataSchema
            ? extractor.templateInstanceDataSchema.parse(
                templateInfo.instanceData,
              )
            : {},
          modifiedTime,
        } satisfies TemplateFileExtractorSourceFile;
      });
    const api = new TemplateExtractorApi(context, type);

    const newEntries = await extractor.extractTemplateMetadataEntries(
      parsedFiles,
      context,
      api,
    );
    metadataEntries.push(...newEntries);
  }

  await runHooks('afterExtract');

  // Merge template entries into extractor configurations
  mergeExtractorTemplateEntries(metadataEntries, context);

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

    await extractor.writeTemplateFiles(
      entries,
      context,
      api,
      templateMetadataFiles,
    );

    const generatorNames = uniq(entries.map((e) => e.generator));
    await extractor.writeGeneratedFiles(generatorNames, context, api);
  }

  // Write extractor.json files before afterWrite hook so writeTemplateFiles can update extractor config
  const generatorNames = uniq(metadataEntries.map((e) => e.generator));
  await writeExtractorTemplateJsons(generatorNames, context);

  await runHooks('afterWrite');

  // Commit the file changes once all the extractors and plugins have written their files
  await fileContainer.commit();

  if (!options?.skipClean) {
    await cleanupUnusedTemplateFiles(generatorNames, context);
  }
}
