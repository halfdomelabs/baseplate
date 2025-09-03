import type {
  TextTemplateInstanceData,
  TextTemplateMetadata,
} from '@baseplate-dev/core-generators';

import { mapValues } from 'es-toolkit';
import { readFile } from 'node:fs/promises';

import type { ServiceActionContext } from '#src/actions/types.js';

import type { ConfigureTemplateResult } from './types.js';

import { updateExtractorTemplate } from '../utils/extractor-config.js';
import { resolveFilePath } from '../utils/resolve-file-path.js';
import { resolveGenerator } from '../utils/resolve-generator.js';
import { updateTemplateMetadata } from '../utils/template-metadata.js';

export interface ConfigureTextTemplateInput {
  filePath: string;
  project?: string;
  generator: string;
  templateName: string;
  variables?: Record<string, { description?: string; value: string }>;
  group?: string;
}

/**
 * Configure a text template with variables for substitution
 */
export async function configureTextTemplate(
  input: ConfigureTextTemplateInput,
  { logger, plugins, projects }: ServiceActionContext,
): Promise<ConfigureTemplateResult> {
  const {
    filePath,
    project: projectNameOrId,
    generator,
    templateName,
    variables,
    group,
  } = input;

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

  // Simple validation to make sure the variables exist inside the file
  const templateContents = await readFile(absolutePath, 'utf8');
  for (const [variable, { value }] of Object.entries(variables ?? {})) {
    if (value === '') {
      throw new Error(`Variable ${variable} must have a value`);
    }
    if (!templateContents.includes(value)) {
      throw new Error(
        `Variable ${variable} with value ${value} not found in template ${absolutePath}`,
      );
    }
  }

  // Update template metadata
  await updateTemplateMetadata(
    absolutePath,
    generator,
    templateName,
    variables &&
      ({
        variables: mapValues(variables, (v) => v.value),
      } satisfies TextTemplateInstanceData),
  );

  // Configure the template
  const templateConfig: Partial<TextTemplateMetadata> = {
    group: group ?? undefined,
  };

  if (variables) {
    templateConfig.variables = mapValues(variables, (v) => ({
      description: v.description,
    }));
  }

  await updateExtractorTemplate(
    generatorDirectory,
    templateName,
    'text',
    templateConfig,
  );

  return {
    message: `Successfully configured text template '${templateName}' for file '${projectRelativePath}' in project '${project.name}'`,
    templateName,
    absolutePath,
    generatorDirectory,
  };
}
