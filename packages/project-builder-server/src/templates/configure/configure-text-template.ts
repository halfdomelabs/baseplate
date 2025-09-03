import type { PluginMetadataWithPaths } from '@baseplate-dev/project-builder-lib';
import type { Logger } from '@baseplate-dev/sync';

import type { ProjectInfo } from '../../api/projects.js';
import type { ConfigureTemplateResult } from './types.js';

import { updateExtractorTemplate } from '../utils/extractor-config.js';
import { resolveGenerator } from '../utils/resolve-generator.js';

export interface ConfigureTextTemplateInput {
  project: ProjectInfo;
  package: string;
  generator: string;
  filePath: string;
  templateName: string;
  variables?: Record<string, { description?: string }>;
  group?: string;
}

/**
 * Configure a text template with variables for substitution
 */
export async function configureTextTemplate(
  input: ConfigureTextTemplateInput,
  plugins: PluginMetadataWithPaths[],
  logger: Logger,
): Promise<ConfigureTemplateResult> {
  const {
    project,
    package: packageName,
    generator,
    filePath,
    templateName,
    variables = {},
    group,
  } = input;

  // Resolve generator directory
  const generatorDirectory = await resolveGenerator(
    project.directory,
    plugins,
    generator,
    logger,
  );

  // Configure the template
  const templateConfig: Record<string, unknown> = {
    sourceFile: filePath,
    variables: Object.keys(variables).length > 0 ? variables : {},
    group: group ?? undefined,
  };

  await updateExtractorTemplate(
    generatorDirectory,
    templateName,
    'text',
    templateConfig,
  );

  return {
    message: `Successfully configured text template '${templateName}' for file '${filePath}' in package '${packageName}'`,
    templateName,
    filePath,
    generatorDirectory,
  };
}
