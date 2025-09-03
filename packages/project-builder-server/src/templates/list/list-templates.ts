import type { TemplateConfig } from '@baseplate-dev/sync';

import { readExtractorConfig } from '../utils/extractor-config.js';

export interface ListTemplatesInput {
  generatorDirectory: string;
}

export interface TemplateInfo {
  name: string;
  type: string;
  sourceFile?: string;
  group?: string;
  kind?: string;
  config: TemplateConfig;
}

export interface ListTemplatesOutput {
  generatorName: string;
  templates: TemplateInfo[];
  templateCount: number;
}

/**
 * List all templates in a generator's extractor.json
 */
export async function listTemplates({
  generatorDirectory,
}: ListTemplatesInput): Promise<ListTemplatesOutput> {
  const config = await readExtractorConfig(generatorDirectory);

  if (!config) {
    throw new Error(`No extractor.json found in ${generatorDirectory}`);
  }

  const templates: TemplateInfo[] = [];

  for (const [name, templateConfig] of Object.entries(config.templates)) {
    templates.push({
      name,
      type: templateConfig.type,
      sourceFile: templateConfig.sourceFile,
      group: (templateConfig as Record<string, unknown>).group as
        | string
        | undefined,
      kind: (templateConfig as Record<string, unknown>).kind as
        | string
        | undefined,
      config: templateConfig,
    });
  }

  // Sort templates by name for consistent output
  templates.sort((a, b) => a.name.localeCompare(b.name));

  return {
    generatorName: config.name,
    templates,
    templateCount: templates.length,
  };
}
