import type { z } from 'zod';

import type {
  TemplateFileMetadataBase,
  templateFileMetadataBaseSchema,
} from '../../metadata/index.js';
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
  TOutputTemplateMetadata extends
    TemplateFileMetadataBase = TemplateFileMetadataBase,
> {
  /**
   * The absolute path of the source file.
   */
  absolutePath: string;
  /**
   * The metadata for the file.
   */
  metadata: TOutputTemplateMetadata;
}

/**
 * A metadata entry that will be added to the `extractor.json` file.
 */
export interface TemplateFileExtractorMetadataEntry<
  TGeneratorTemplateMetadata extends TemplateConfig = TemplateConfig,
> {
  /**
   * The name of the generator.
   */
  generator: string;
  /**
   * The relative path of the file in the templates/ folder.
   */
  generatorTemplatePath: string;
  /**
   * Absolute path of the source file.
   */
  sourceAbsolutePath: string;
  /**
   * The metadata for the file.
   */
  metadata: TGeneratorTemplateMetadata;
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
  TGeneratorTemplateMetadata extends z.ZodSchema = typeof templateConfigSchema,
  TOutputTemplateMetadata extends
    z.ZodSchema = typeof templateFileMetadataBaseSchema,
  TExtractorConfig extends z.ZodSchema = z.ZodUnknown,
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
  generatorTemplateMetadataSchema?: TGeneratorTemplateMetadata;
  /**
   * The schema for the metadata for a generated file in the `.template-metadata.json` file.
   */
  outputTemplateMetadataSchema?: TOutputTemplateMetadata;
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
   * @param files - The files to extract metadata from.
   * @param context - The context for the extractor.
   */
  extractTemplateMetadataEntries(
    files: TemplateFileExtractorSourceFile<z.infer<TOutputTemplateMetadata>>[],
    context: TemplateExtractorContext<TPluginDependencies>,
  ):
    | Promise<
        TemplateFileExtractorMetadataEntry<
          z.infer<TGeneratorTemplateMetadata>
        >[]
      >
    | TemplateFileExtractorMetadataEntry<z.infer<TGeneratorTemplateMetadata>>[];

  /**
   * Writes the files in the metadata entries to the generator's templates directory converting
   * any written templates to their templatized form.
   *
   * @param metadataEntries - The metadata entries to write.
   * @param context - The context for the extractor.
   * @param api - The API for the extractor.
   */
  writeTemplateFiles(
    metadataEntries: TemplateFileExtractorMetadataEntry<
      z.infer<TGeneratorTemplateMetadata>
    >[],
    context: TemplateExtractorContext<TPluginDependencies>,
    api: TemplateExtractorApi,
  ): Promise<void>;

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

export type AnyTemplateFileExtractor = TemplateFileExtractor<
  z.ZodSchema,
  z.ZodSchema
>;

/**
 * Creates a typed TemplateFileExtractor.
 */
export function createTemplateFileExtractor<
  TGeneratorTemplateMetadata extends z.ZodSchema = typeof templateConfigSchema,
  TOutputTemplateMetadata extends
    z.ZodSchema = typeof templateFileMetadataBaseSchema,
  TExtractorConfig extends z.ZodSchema = z.ZodUnknown,
  TPluginDependencies extends
    TemplateExtractorPluginDependencies = TemplateExtractorPluginDependencies,
>(
  input: TemplateFileExtractor<
    TGeneratorTemplateMetadata,
    TOutputTemplateMetadata,
    TExtractorConfig,
    TPluginDependencies
  >,
): TemplateFileExtractor<
  TGeneratorTemplateMetadata,
  TOutputTemplateMetadata,
  TExtractorConfig,
  TPluginDependencies
> {
  return input;
}
