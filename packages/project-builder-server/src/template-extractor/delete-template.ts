import type { PluginMetadataWithPaths } from '@baseplate-dev/project-builder-lib';
import type { Logger } from '@baseplate-dev/sync';

import { extractorConfigSchema, parseGeneratorName } from '@baseplate-dev/sync';
import { stringifyPrettyCompact } from '@baseplate-dev/utils';
import {
  handleFileNotFoundError,
  readJsonWithSchema,
} from '@baseplate-dev/utils/node';
import fs from 'node:fs/promises';
import path from 'node:path';

import { discoverGenerators } from './discover-generators.js';

/**
 * Options for the delete-template command
 */
interface DeleteTemplateOptions {
  /**
   * The default plugins to use
   */
  defaultPlugins: PluginMetadataWithPaths[];
  /**
   * The directory to search for generators
   */
  directory?: string;
  /**
   * The logger to use
   */
  logger: Logger;
}

/**
 * Deletes a template from a generator extractor.json file
 */
export async function deleteTemplate(
  generatorName: string,
  templateName: string,
  options: DeleteTemplateOptions,
): Promise<void> {
  const generators = await discoverGenerators(
    options.directory,
    options.defaultPlugins,
    options.logger,
  );

  // Pull the generator config
  const generator = generators.find((g) => {
    const parsedGeneratorName = parseGeneratorName(g.name);
    return (
      g.name === generatorName ||
      parsedGeneratorName.generatorPath === generatorName
    );
  });
  if (!generator) {
    throw new Error(`Generator '${generatorName}' not found`);
  }

  const extractorJsonPath = path.join(
    generator.generatorDirectory,
    'extractor.json',
  );

  const templateExtractorJson = await readJsonWithSchema(
    extractorJsonPath,
    extractorConfigSchema,
  );

  const templatePath = Object.keys(templateExtractorJson.templates).find(
    (templatePath) => generator.templates[templatePath].name === templateName,
  );

  if (!templatePath) {
    throw new Error(
      `Template '${templateName}' not found in generator '${generatorName}'`,
    );
  }

  const updatedTemplates = templateExtractorJson.templates;
  // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- easiest way of deleting without reordering the keys
  delete updatedTemplates[templatePath];

  // Write the updated configuration back to the extractor.json file

  await fs.writeFile(
    extractorJsonPath,
    stringifyPrettyCompact(templateExtractorJson),
    'utf8',
  );

  // Clean up the actual template file if it exists
  const templateFilePath = path.join(
    generator.generatorDirectory,
    'templates',
    templatePath,
  );
  await fs.unlink(templateFilePath).catch(handleFileNotFoundError);
}
