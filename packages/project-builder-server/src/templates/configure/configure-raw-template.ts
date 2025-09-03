import type { PluginMetadataWithPaths } from '@baseplate-dev/project-builder-lib';
import type { Logger } from '@baseplate-dev/sync';

import type { ProjectInfo } from '../../api/projects.js';
import type { ConfigureTemplateResult } from './types.js';

import { updateExtractorTemplate } from '../utils/extractor-config.js';
import { resolveGenerator } from '../utils/resolve-generator.js';

export interface ConfigureRawTemplateInput {
  project: ProjectInfo;
  package: string;
  generator: string;
  filePath: string;
  templateName: string;
  group?: string;
}

/**
 * Configure a raw/binary template for copying files as-is
 */
export async function configureRawTemplate(
  input: ConfigureRawTemplateInput,
  plugins: PluginMetadataWithPaths[],
  logger: Logger,
): Promise<ConfigureTemplateResult> {
  const {
    project,
    package: packageName,
    generator,
    filePath,
    templateName,
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
    group: group ?? undefined,
  };

  await updateExtractorTemplate(
    generatorDirectory,
    templateName,
    'raw',
    templateConfig,
  );

  return {
    message: `Successfully configured raw template '${templateName}' for file '${filePath}' in package '${packageName}'`,
    templateName,
    filePath,
    generatorDirectory,
  };
}
