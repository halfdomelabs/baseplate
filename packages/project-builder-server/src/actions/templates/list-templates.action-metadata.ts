import { z } from 'zod';

import { createServiceActionMetadata } from '#src/actions/types.js';

const listTemplatesInputSchema = z.object({
  generatorDirectory: z
    .string()
    .describe('The directory path containing the generator'),
});

const templateInfoSchema = z.object({
  name: z.string().describe('The name of the template'),
  type: z.string().describe('The type of the template'),
  sourceFile: z.string().optional().describe('The source file path'),
  group: z.string().optional().describe('The template group'),
  kind: z.string().optional().describe('The template kind'),
  config: z
    .record(z.string(), z.any())
    .describe('The full template configuration'),
});

const listTemplatesOutputSchema = z.object({
  message: z.string().describe('Success message'),
  generatorName: z.string().describe('The name of the generator'),
  generatorDirectory: z.string().describe('The generator directory'),
  templates: z.array(templateInfoSchema).describe('List of templates'),
  templateCount: z.number().describe('Total number of templates'),
});

export const listTemplatesMetadata = createServiceActionMetadata({
  name: 'list-templates',
  title: 'List Templates in Generator',
  description: 'List all templates in a specific generator directory',
  inputSchema: listTemplatesInputSchema,
  outputSchema: listTemplatesOutputSchema,
  scope: 'dev',
});
