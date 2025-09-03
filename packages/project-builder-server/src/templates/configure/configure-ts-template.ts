import type { TsTemplateMetadata } from '@baseplate-dev/core-generators';

import type { ServiceActionContext } from '#src/actions/types.js';

import type { TsFileExportInfo } from '../utils/infer-exports-from-ts-file.js';
import type { ConfigureTemplateResult } from './types.js';

import { updateExtractorTemplate } from '../utils/extractor-config.js';
import { inferExportsFromTsFile } from '../utils/infer-exports-from-ts-file.js';
import { resolveFilePath } from '../utils/resolve-file-path.js';
import { resolveGenerator } from '../utils/resolve-generator.js';
import { updateTemplateMetadata } from '../utils/template-metadata.js';

export interface ConfigureTsTemplateInput {
  filePath: string;
  project?: string;
  generator: string;
  templateName: string;
  projectExports?: string[];
  group?: string;
}

/**
 * Configure a TypeScript template with project exports and validation
 */
export async function configureTsTemplate(
  input: ConfigureTsTemplateInput,
  { logger, plugins, projects }: ServiceActionContext,
): Promise<ConfigureTemplateResult> {
  const {
    filePath,
    project: projectNameOrId,
    generator,
    templateName,
    projectExports: projectExportsList = [],
    group,
  } = input;

  // Resolve file path to project and package info
  const { absolutePath, project, projectRelativePath } = resolveFilePath(
    filePath,
    projects,
    projectNameOrId,
  );

  // Validate exports if provided
  const projectExports: Record<string, TsFileExportInfo> = {};
  if (projectExportsList.length > 0) {
    const availableExports = inferExportsFromTsFile(absolutePath);
    for (const exportName of projectExportsList) {
      const exportInfo = availableExports.get(exportName);
      if (exportInfo) {
        projectExports[exportName] = exportInfo;
      } else {
        throw new Error(`Export ${exportName} not found in ${absolutePath}`);
      }
    }
  }
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
  const templateConfig: Partial<TsTemplateMetadata> = {
    projectExports:
      Object.keys(projectExports).length > 0 ? projectExports : undefined,
    group: group ?? undefined,
  };

  await updateExtractorTemplate(
    generatorDirectory,
    templateName,
    'ts',
    templateConfig,
  );

  return {
    message: `Successfully configured TypeScript template '${templateName}' for file '${projectRelativePath}' in project '${project.name}'`,
    templateName,
    absolutePath,
    generatorDirectory,
  };
}
