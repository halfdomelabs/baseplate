import { z } from 'zod';

import { createServiceActionMetadata } from '#src/actions/types.js';

const extractTemplatesInputSchema = z.object({
  project: z
    .string()
    .describe('The name or ID of the project to extract templates from.'),
  app: z.string().describe('The app name to extract templates from.'),
  autoGenerateExtractor: z
    .boolean()
    .optional()
    .default(true)
    .describe('Auto-generate extractor.json files.'),
  skipClean: z
    .boolean()
    .optional()
    .default(false)
    .describe(
      'Skip cleaning the output directories (templates and generated).',
    ),
});
const extractTemplatesOutputSchema = z.object({
  success: z
    .boolean()
    .describe('Whether the template extraction was successful.'),
  message: z.string().describe('Success message.'),
});

export const extractTemplatesMetadata = createServiceActionMetadata({
  name: 'extract-templates',
  title: 'Extract Templates',
  description: 'Extract templates from the specified project and app',
  inputSchema: extractTemplatesInputSchema,
  outputSchema: extractTemplatesOutputSchema,
  scope: 'dev',
});
