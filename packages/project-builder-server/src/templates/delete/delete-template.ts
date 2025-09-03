import { handleFileNotFoundError } from '@baseplate-dev/utils/node';
import fs from 'node:fs/promises';
import path from 'node:path';

import {
  readExtractorConfig,
  removeExtractorTemplate,
} from '../utils/extractor-config.js';

export interface DeleteTemplateInput {
  generatorDirectory: string;
  templateName: string;
}

/**
 * Delete a template from a generator's extractor.json and remove the template file
 */
export async function deleteTemplate({
  generatorDirectory,
  templateName,
}: DeleteTemplateInput): Promise<void> {
  const config = await readExtractorConfig(generatorDirectory);

  if (!config || !(templateName in config.templates)) {
    throw new Error(
      `Template '${templateName}' not found in generator at ${generatorDirectory}`,
    );
  }

  const templateConfig = config.templates[templateName];
  const templatePath = templateConfig.sourceFile;

  // Remove from extractor.json
  await removeExtractorTemplate(generatorDirectory, templateName);

  // Clean up the actual template file if it exists and has a sourceFile path
  if (templatePath) {
    const templateFilePath = path.join(
      generatorDirectory,
      'templates',
      templatePath,
    );
    await fs.unlink(templateFilePath).catch(handleFileNotFoundError);
  }
}
