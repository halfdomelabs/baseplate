import type { ExtractorConfig, TemplateConfig } from '@baseplate-dev/sync';

import {
  EXTRACTOR_CONFIG_FILENAME,
  extractorConfigSchema,
  sortExtractorConfigKeys,
} from '@baseplate-dev/sync';
import {
  handleFileNotFoundError,
  readJsonWithSchema,
  writeStablePrettyJson,
} from '@baseplate-dev/utils/node';
import path from 'node:path';

/**
 * Read extractor.json configuration from a generator directory
 */
export async function readExtractorConfig(
  generatorDirectory: string,
): Promise<ExtractorConfig | undefined> {
  const extractorPath = path.join(
    generatorDirectory,
    EXTRACTOR_CONFIG_FILENAME,
  );

  return readJsonWithSchema(extractorPath, extractorConfigSchema).catch(
    handleFileNotFoundError,
  );
}

/**
 * Write extractor.json configuration to a generator directory
 */
export async function writeExtractorConfig(
  generatorDirectory: string,
  config: ExtractorConfig,
): Promise<void> {
  const extractorPath = path.join(
    generatorDirectory,
    EXTRACTOR_CONFIG_FILENAME,
  );

  const sortedConfig = sortExtractorConfigKeys(config);

  await writeStablePrettyJson(extractorPath, sortedConfig);
}

/**
 * Update a template configuration in extractor.json
 */
export async function updateExtractorTemplate(
  generatorDirectory: string,
  templateName: string,
  templateType = 'ts',
  overwriteConfig?: Partial<TemplateConfig>,
  defaultConfig: Partial<TemplateConfig> = {},
): Promise<void> {
  const config = await readExtractorConfig(generatorDirectory);

  if (!config) {
    throw new Error(`No extractor.json found in ${generatorDirectory}`);
  }

  // Update or add the template configuration
  const existingTemplate =
    templateName in config.templates ? config.templates[templateName] : {};
  const existingTemplateTyped = existingTemplate as TemplateConfig;

  config.templates[templateName] = {
    ...defaultConfig, // Apply default config if provided
    type: templateType,
    sourceFile: existingTemplateTyped.sourceFile || '', // Preserve existing or default to empty string
    fileOptions: { kind: 'singleton' },
    ...existingTemplate, // Preserve existing properties
    ...overwriteConfig, // Apply any additional template config
  };

  await writeExtractorConfig(generatorDirectory, config);
}

/**
 * Remove a template configuration from extractor.json
 */
export async function removeExtractorTemplate(
  generatorDirectory: string,
  templateName: string,
): Promise<void> {
  const config = await readExtractorConfig(generatorDirectory);

  if (!config) {
    throw new Error(`No extractor.json found in ${generatorDirectory}`);
  }

  // Remove the template configuration
  // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
  delete config.templates[templateName];

  await writeExtractorConfig(generatorDirectory, config);
}
