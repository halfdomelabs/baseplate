import type { ServiceActionContext } from '#src/actions/types.js';

import { resolveFilePath } from '../utils/resolve-file-path.js';
import { readTemplateMetadataForFile } from '../utils/template-metadata.js';

export interface ShowTemplateMetadataInput {
  filePath: string;
  project?: string;
}

export interface ShowTemplateMetadataResult {
  message: string;
  filePath: string;
  absolutePath: string;
  templateName: string;
  generator: string;
  instanceData?: Record<string, unknown>;
  hasMetadata: boolean;
}

/**
 * Show template metadata for a specific file
 */
export async function showTemplateMetadata(
  input: ShowTemplateMetadataInput,
  { projects }: ServiceActionContext,
): Promise<ShowTemplateMetadataResult> {
  const { filePath, project: projectNameOrId } = input;

  // Resolve file path to project and package info
  const { absolutePath, project, projectRelativePath } = resolveFilePath(
    filePath,
    projects,
    projectNameOrId,
  );

  try {
    // Read template metadata for this file
    const templateInfo = await readTemplateMetadataForFile(absolutePath);
    const { template: templateName, generator, instanceData } = templateInfo;

    return {
      message: `Template metadata found for '${projectRelativePath}' in project '${project.name}'`,
      filePath: projectRelativePath,
      absolutePath,
      templateName,
      generator,
      instanceData,
      hasMetadata: true,
    };
  } catch {
    // File has no template metadata
    return {
      message: `No template metadata found for '${projectRelativePath}' in project '${project.name}'`,
      filePath: projectRelativePath,
      absolutePath,
      templateName: '',
      generator: '',
      instanceData: undefined,
      hasMetadata: false,
    };
  }
}
