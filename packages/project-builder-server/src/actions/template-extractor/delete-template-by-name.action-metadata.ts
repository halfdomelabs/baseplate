import { z } from 'zod';

import { createServiceActionMetadata } from '#src/actions/types.js';

const deleteTemplateByNameInputSchema = z.object({
  generatorName: z
    .string()
    .describe('The name of the generator containing the template'),
  templateName: z.string().describe('The name of the template to delete'),
  directory: z
    .string()
    .optional()
    .describe(
      'Directory to search for generators. If not provided, uses current directory.',
    ),
});
const deleteTemplateByNameOutputSchema = z.object({
  success: z
    .boolean()
    .describe('Whether the template deletion was successful.'),
  message: z.string().describe('Success message.'),
});

export const deleteTemplateByNameMetadata = createServiceActionMetadata({
  name: 'delete-template-by-name',
  title: 'Delete Template by Name',
  description:
    'Delete a specific template from a generator by generator name and template name',
  inputSchema: deleteTemplateByNameInputSchema,
  outputSchema: deleteTemplateByNameOutputSchema,
  scope: 'dev',
});
