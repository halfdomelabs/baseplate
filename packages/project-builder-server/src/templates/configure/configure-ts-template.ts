import type { PluginMetadataWithPaths } from '@baseplate-dev/project-builder-lib';
import type { Logger } from '@baseplate-dev/sync';

import path from 'node:path';

import type { ProjectInfo } from '../../api/projects.js';
import type { TsFileExportInfo } from '../utils/infer-exports-from-ts-file.js';
import type { ConfigureTemplateResult } from './types.js';

import { updateExtractorTemplate } from '../utils/extractor-config.js';
import { inferExportsFromTsFile } from '../utils/infer-exports-from-ts-file.js';
import { resolveGenerator } from '../utils/resolve-generator.js';

export interface ConfigureTsTemplateInput {
  project: ProjectInfo;
  package: string;
  generator: string;
  filePath: string;
  templateName: string;
  projectExports?: string[];
  group?: string;
}

/**
 * Configure a TypeScript template with project exports and validation
 */
export async function configureTsTemplate(
  input: ConfigureTsTemplateInput,
  plugins: PluginMetadataWithPaths[],
  logger: Logger,
): Promise<ConfigureTemplateResult> {
  const {
    project,
    package: packageName,
    generator,
    filePath,
    templateName,
    projectExports: projectExportsList = [],
    group,
  } = input;

  // Get full file path (packages/[packageName]/[filePath])
  const absoluteFilePath = path.resolve(
    project.directory,
    'packages',
    packageName,
    filePath,
  );

  // Validate exports if provided
  const projectExports: Record<string, TsFileExportInfo> = {};
  if (projectExportsList.length > 0) {
    const availableExports = inferExportsFromTsFile(absoluteFilePath);
    for (const exportName of projectExportsList) {
      const exportInfo = availableExports.get(exportName);
      if (exportInfo) {
        projectExports[exportName] = exportInfo;
      } else {
        throw new Error(
          `Export ${exportName} not found in ${absoluteFilePath}`,
        );
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

  // Configure the template
  const templateConfig: Record<string, unknown> = {
    sourceFile: filePath,
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
    message: `Successfully configured TypeScript template '${templateName}' for file '${filePath}' in package '${packageName}'`,
    templateName,
    filePath,
    generatorDirectory,
  };
}
