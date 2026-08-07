import { z } from 'zod';

import { createServiceActionMetadata } from '#src/actions/types.js';

const deleteTemplateInputSchema = z.object({
  filePath: z
    .string()
    .describe('Path to file to delete (absolute or relative)'),
  project: z
    .string()
    .optional()
    .describe(
      'Project name or ID (required for relative paths, optional for absolute)',
    ),
});
const deleteTemplateOutputSchema = z.object({
  success: z.boolean().describe('Whether the operation was successful'),
  message: z.string().describe('Success message'),
  templateName: z.string().describe('The template name that was deleted'),
  absolutePath: z.string().describe('The absolute path of the deleted file'),
  generatorDirectory: z.string().describe('The generator directory used'),
});

export const deleteTemplateMetadata = createServiceActionMetadata({
  name: 'delete-template',
  title: 'Delete Template',
  description:
    'Delete a template by looking up its metadata from the file path and removing all associated files',
  inputSchema: deleteTemplateInputSchema,
  outputSchema: deleteTemplateOutputSchema,
  scope: 'dev',
});
