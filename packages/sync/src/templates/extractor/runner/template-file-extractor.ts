import type { z } from 'zod';

import type { TemplateMetadataFileEntry } from '#src/templates/metadata/read-template-info-files.js';

import type {
  TemplateConfig,
  templateConfigSchema,
} from '../configs/extractor-config.schema.js';
import type { TemplateExtractorApi } from './template-extractor-api.js';
import type { TemplateExtractorContext } from './template-extractor-context.js';
import type { TemplateExtractorPluginDependencies } from './template-extractor-plugin.js';

/**
 * A source file for a template file extractor annotated with metadata.
 */
export interface TemplateFileExtractorSourceFile<
  TGeneratorTemplateMetadata extends TemplateConfig = TemplateConfig,
  TInstanceData extends Record<string, unknown> = Record<string, unknown>,
> {
  /**
   * The absolute path of the source file.
   */
  absolutePath: string;
  /**
   * The name of the template.
   */
  templateName: string;
  /**
   * The name of the generator.
   */
  generatorName: string;
  /**
   * The existing metadata for the template.
   */
  existingMetadata: TGeneratorTemplateMetadata;
  /**
   * The instance data for the file.
   */
  instanceData: TInstanceData;
  /**
   * The modified time of the file.
   */
  modifiedTime: Date;
}

/**
 * A metadata entry that will be upserted to the `extractor.json` file.
 */
export interface TemplateFileExtractorMetadataEntry<
  TGeneratorTemplateMetadata extends TemplateConfig = TemplateConfig,
  TInstanceData extends Record<string, unknown> = Record<string, unknown>,
> {
  /**
   * The name of the generator.
   */
  generator: string;
  /**
   * The absolute path of the source file.
   */
  sourceAbsolutePath: string;
  /**
   * The name of the template.
   */
  templateName: string;
  /**
   * The metadata for the template.
   */
  metadata: TGeneratorTemplateMetadata;
  /**
   * Instance data attached to the template.
   */
  instanceData: TInstanceData;
}

/**
 * The TemplateFileExtractor implements the core logic for extracting template
 * metadata from source files.
 *
 * It is responsible for:
 * - Extracting metadata from source files
 * - Writing metadata to the `extractor.json` file
 * - Writing template files to the package
 */
export interface TemplateFileExtractor<
  TTemplateMetadataSchema extends
    typeof templateConfigSchema = typeof templateConfigSchema,
  TTemplateInstanceDataSchema extends z.ZodObject = z.ZodObject,
  TExtractorConfig extends z.ZodType = z.ZodUnknown,
  TPluginDependencies extends
    TemplateExtractorPluginDependencies = TemplateExtractorPluginDependencies,
> {
  /**
   * The name of the extractor.
   */
  name: string;
  /**
   * The schema for the metadata for a template in the `extractor.json` file.
   */
  templateMetadataSchema?: TTemplateMetadataSchema;
  /**
   * The schema for the instance data for a template in the `.templates-info.json` file.
   */
  templateInstanceDataSchema?: TTemplateInstanceDataSchema;
  /**
   * The schema for the config for the extractor in the `extractor.json` file.
   */
  extractorConfigSchema?: TExtractorConfig;
  /**
   * The plugins to use for the extractor.
   */
  pluginDependencies?: TPluginDependencies;

  /**
   * Extracts the metadata entries for the given files.
   *
   * Note: Duplicate templates may exist so make sure you deduplicate the templates appropriately.
   *
   * @param files - The files to extract metadata from.
   * @param context - The context for the extractor.
   *
   * @returns The metadata entries for the given files.
   */
  extractTemplateMetadataEntries(
    files: TemplateFileExtractorSourceFile<
      z.output<TTemplateMetadataSchema>,
      z.output<TTemplateInstanceDataSchema>
    >[],
    context: TemplateExtractorContext<TPluginDependencies>,
    api: TemplateExtractorApi,
  ):
    | TemplateFileExtractorMetadataEntry<
        z.output<TTemplateMetadataSchema>,
        z.output<TTemplateInstanceDataSchema>
      >[]
    | Promise<
        TemplateFileExtractorMetadataEntry<
          z.output<TTemplateMetadataSchema>,
          z.output<TTemplateInstanceDataSchema>
        >[]
      >;

  /**
   * Writes the template files to the generator's templates directory.
   *
   * @param files - The metadata entries for the files to write.
   * @param context - The context for the extractor.
   * @param api - The API for reading and writing files.
   * @param allFiles - All the files with metadata in the output directory.
   */
  writeTemplateFiles(
    files: TemplateFileExtractorMetadataEntry<
      z.infer<TTemplateMetadataSchema>,
      z.infer<TTemplateInstanceDataSchema>
    >[],
    context: TemplateExtractorContext<TPluginDependencies>,
    api: TemplateExtractorApi,
    allFiles: TemplateMetadataFileEntry[],
  ): Promise<void> | void;

  /**
   * Writes the files in the metadata entries to the generator's generated directory creating
   * the necessary typed template files.
   *
   * @param generatorNames - The names of the generators to write.
   * @param context - The context for the extractor.
   * @param api - The API for the extractor.
   */
  writeGeneratedFiles(
    generatorNames: string[],
    context: TemplateExtractorContext<TPluginDependencies>,
    api: TemplateExtractorApi,
  ): Promise<void> | void;
}

// TODO [2025-11-23]: Do we need this type anymore?
export type AnyTemplateFileExtractor = TemplateFileExtractor;

/**
 * Creates a typed TemplateFileExtractor.
 */
export function createTemplateFileExtractor<
  TGeneratorTemplateMetadata extends
    typeof templateConfigSchema = typeof templateConfigSchema,
  TTemplateInstanceData extends z.ZodObject = z.ZodObject,
  TExtractorConfig extends z.ZodType = z.ZodUnknown,
  TPluginDependencies extends
    TemplateExtractorPluginDependencies = TemplateExtractorPluginDependencies,
>(
  input: TemplateFileExtractor<
    TGeneratorTemplateMetadata,
    TTemplateInstanceData,
    TExtractorConfig,
    TPluginDependencies
  >,
): TemplateFileExtractor<
  TGeneratorTemplateMetadata,
  TTemplateInstanceData,
  TExtractorConfig,
  TPluginDependencies
> {
  return input;
}
