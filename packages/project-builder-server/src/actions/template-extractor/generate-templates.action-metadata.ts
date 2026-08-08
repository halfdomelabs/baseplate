import { z } from 'zod';

import { createServiceActionMetadata } from '#src/actions/types.js';

const generateTemplatesInputSchema = z.object({
  project: z
    .string()
    .optional()
    .describe(
      'Optionally, specify the project to source the generators from. If not, it will use the default set of plugins.',
    ),
  skipClean: z
    .boolean()
    .optional()
    .default(false)
    .describe(
      'Skip cleaning the output directories (templates and generated).',
    ),
});
const generateTemplatesOutputSchema = z.object({
  success: z
    .boolean()
    .describe('Whether the template generation was successful.'),
  message: z.string().describe('Success message.'),
});

export const generateTemplatesMetadata = createServiceActionMetadata({
  name: 'generate-templates',
  title: 'Generate Templates',
  description:
    'Generate typed template files from existing extractor.json configurations',
  inputSchema: generateTemplatesInputSchema,
  outputSchema: generateTemplatesOutputSchema,
  scope: 'dev',
});
