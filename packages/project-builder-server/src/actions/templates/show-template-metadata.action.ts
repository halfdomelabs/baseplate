import { z } from 'zod';

import { createServiceAction } from '#src/actions/types.js';

const showTemplateMetadataInputSchema = {
  filePath: z
    .string()
    .describe('Path to file to show metadata for (absolute or relative)'),
  project: z
    .string()
    .optional()
    .describe(
      'Project name or ID (required for relative paths, optional for absolute)',
    ),
};

const showTemplateMetadataOutputSchema = {
  message: z.string().describe('Status message'),
  filePath: z.string().describe('The relative file path within the project'),
  absolutePath: z.string().describe('The absolute path to the file'),
  templateName: z.string().describe('The template name (empty if no metadata)'),
  generator: z.string().describe('The generator name (empty if no metadata)'),
  instanceData: z
    .record(z.string(), z.unknown())
    .optional()
    .describe('Template instance data if available'),
  hasMetadata: z.boolean().describe('Whether the file has template metadata'),
};

/**
 * Service action to show template metadata for a file
 */
export const showTemplateMetadataAction = createServiceAction({
  name: 'show-template-metadata',
  title: 'Show Template Metadata',
  description:
    'Show template metadata for a file by looking up information from .templates-info.json',
  inputSchema: showTemplateMetadataInputSchema,
  outputSchema: showTemplateMetadataOutputSchema,
  handler: async (input, context) => {
    const { filePath, project } = input;

    const { showTemplateMetadata } = await import(
      '../../templates/show/show-template-metadata.js'
    );

    const result = await showTemplateMetadata(
      {
        filePath,
        project,
      },
      context,
    );

    return result;
  },
  writeCliOutput: (output) => {
    if (output.hasMetadata) {
      console.info(`📄 ${output.message}`);
      console.info(`  Template: ${output.templateName}`);
      console.info(`  Generator: ${output.generator}`);
      if (output.instanceData && Object.keys(output.instanceData).length > 0) {
        console.info(
          `  Instance Data: ${JSON.stringify(output.instanceData, null, 2)}`,
        );
      }
    } else {
      console.info(`ℹ️  ${output.message}`);
      console.info(
        '  Use configure-ts-template, configure-text-template, or configure-raw-template to add metadata',
      );
    }
  },
});
