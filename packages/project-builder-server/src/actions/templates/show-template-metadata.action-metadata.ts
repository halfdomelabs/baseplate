import { z } from 'zod';

import { createServiceActionMetadata } from '#src/actions/types.js';

const showTemplateMetadataInputSchema = z.object({
  filePath: z
    .string()
    .describe('Path to file to show metadata for (absolute or relative)'),
  project: z
    .string()
    .optional()
    .describe(
      'Project name or ID (required for relative paths, optional for absolute)',
    ),
});
const showTemplateMetadataOutputSchema = z.object({
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
});

export const showTemplateMetadataMetadata = createServiceActionMetadata({
  name: 'show-template-metadata',
  title: 'Show Template Metadata',
  description:
    'Show template metadata for a file by looking up information from .templates-info.json',
  inputSchema: showTemplateMetadataInputSchema,
  outputSchema: showTemplateMetadataOutputSchema,
  scope: 'dev',
});
