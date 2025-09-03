import { handleFileNotFoundError } from '@baseplate-dev/utils/node';
import fs from 'node:fs/promises';
import path from 'node:path';

import type { ServiceActionContext } from '#src/actions/types.js';

import {
  readExtractorConfig,
  removeExtractorTemplate,
} from '../utils/extractor-config.js';
import { resolveFilePath } from '../utils/resolve-file-path.js';
import { resolveGenerator } from '../utils/resolve-generator.js';
import {
  readTemplateMetadataForFile,
  removeTemplateMetadata,
} from '../utils/template-metadata.js';

export interface DeleteTemplateInput {
  filePath: string;
  project?: string;
}

export interface DeleteTemplateResult {
  message: string;
  templateName: string;
  absolutePath: string;
  generatorDirectory: string;
}

/**
 * Delete a template by looking up its metadata from the file path
 */
export async function deleteTemplate(
  input: DeleteTemplateInput,
  { logger, plugins, projects }: ServiceActionContext,
): Promise<DeleteTemplateResult> {
  const { filePath, project: projectNameOrId } = input;

  // Resolve file path to project and package info
  const { absolutePath, project, projectRelativePath } = resolveFilePath(
    filePath,
    projects,
    projectNameOrId,
  );

  // Read template metadata for this file
  const templateInfo = await readTemplateMetadataForFile(absolutePath);
  const { template: templateName, generator } = templateInfo;

  // Resolve generator directory
  const generatorDirectory = await resolveGenerator(
    project.directory,
    plugins,
    generator,
    logger,
  );

  // Verify template exists in extractor.json
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

  // Remove template metadata
  await removeTemplateMetadata(absolutePath);

  // Delete the generated file itself
  await fs.unlink(absolutePath).catch(handleFileNotFoundError);

  return {
    message: `Successfully deleted template '${templateName}' and file '${projectRelativePath}' from project '${project.name}'`,
    templateName,
    absolutePath,
    generatorDirectory,
  };
}
