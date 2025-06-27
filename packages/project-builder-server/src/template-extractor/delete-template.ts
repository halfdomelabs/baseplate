import type { PluginMetadataWithPaths } from '@baseplate-dev/project-builder-lib';
import type { Logger } from '@baseplate-dev/sync';

import { stringifyPrettyCompact } from '@baseplate-dev/utils';
import { handleFileNotFoundError } from '@baseplate-dev/utils/node';
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
  const generator = generators.find((g) => g.name === generatorName);
  if (!generator) {
    throw new Error(`Generator '${generatorName}' not found`);
  }

  const templatePath = Object.keys(generator.templates).find(
    (templatePath) => generator.templates[templatePath].name === templateName,
  );

  if (!templatePath) {
    throw new Error(
      `Template '${templateName}' not found in generator '${generatorName}'`,
    );
  }

  const updatedTemplates = {
    ...generator.templates,
    [templatePath]: undefined,
  };

  // Write the updated configuration back to the extractor.json file
  const extractorJsonPath = path.join(
    generator.generatorDirectory,
    'extractor.json',
  );

  await fs.writeFile(
    extractorJsonPath,
    stringifyPrettyCompact(updatedTemplates),
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
