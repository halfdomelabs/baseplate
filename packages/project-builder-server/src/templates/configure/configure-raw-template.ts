import type { RawTemplateMetadata } from '@baseplate-dev/core-generators';

import type { ServiceActionContext } from '#src/actions/types.js';

import type { ConfigureTemplateResult } from './types.js';

import { updateExtractorTemplate } from '../utils/extractor-config.js';
import { resolveFilePath } from '../utils/resolve-file-path.js';
import { resolveGenerator } from '../utils/resolve-generator.js';
import { updateTemplateMetadata } from '../utils/template-metadata.js';

export interface ConfigureRawTemplateInput {
  filePath: string;
  project?: string;
  generator: string;
  templateName: string;
}

/**
 * Configure a raw/binary template for copying files as-is
 */
export async function configureRawTemplate(
  input: ConfigureRawTemplateInput,
  { logger, plugins, projects }: ServiceActionContext,
): Promise<ConfigureTemplateResult> {
  const { filePath, project: projectNameOrId, generator, templateName } = input;

  // Resolve file path to project and package info
  const { absolutePath, project, projectRelativePath } = resolveFilePath(
    filePath,
    projects,
    projectNameOrId,
  );

  // Resolve generator directory
  const generatorDirectory = await resolveGenerator(
    project.directory,
    plugins,
    generator,
    logger,
  );

  // Update template metadata
  await updateTemplateMetadata(absolutePath, generator, templateName);

  // Configure the template
  const templateConfig: Partial<RawTemplateMetadata> = {};

  await updateExtractorTemplate(
    generatorDirectory,
    templateName,
    'raw',
    templateConfig,
  );

  return {
    message: `Successfully configured raw template '${templateName}' for file '${projectRelativePath}' in project '${project.name}'`,
    templateName,
    absolutePath,
    generatorDirectory,
  };
}
