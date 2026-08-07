import { z } from 'zod';

import { createServiceActionMetadata } from '#src/actions/types.js';

const variableSchema = z.object({
  description: z
    .string()
    .optional()
    .describe('Optional description for the variable'),
  value: z.string().min(1).describe('The value of the variable'),
});
const configureTextTemplateInputSchema = z.object({
  filePath: z.string().describe('File path (absolute or relative)'),
  project: z
    .string()
    .optional()
    .describe('Project name or ID (required for relative paths)'),
  generator: z
    .string()
    .describe('The generator name (e.g., @baseplate-dev/react-generators)'),
  templateName: z.string().describe('Template name in kebab-case format'),
  variables: z
    .record(z.string(), variableSchema)
    .optional()
    .describe('Object mapping variable names to their metadata'),
  group: z.string().optional().describe('Optional template group'),
});
const configureTextTemplateOutputSchema = z.object({
  message: z.string().describe('Success message'),
  templateName: z.string().describe('The configured template name'),
  absolutePath: z
    .string()
    .describe('The absolute file path that was configured'),
  generatorDirectory: z
    .string()
    .describe('The generator directory that was configured'),
});

export const configureTextTemplateMetadata = createServiceActionMetadata({
  name: 'configure-text-template',
  title: 'Configure Text Template',
  description: 'Configure a text template with variables for substitution',
  inputSchema: configureTextTemplateInputSchema,
  outputSchema: configureTextTemplateOutputSchema,
  scope: 'dev',
});
