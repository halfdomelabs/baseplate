import { z } from 'zod';

import { createServiceActionMetadata } from '#src/actions/types.js';

const configureRawTemplateInputSchema = z.object({
  filePath: z.string().describe('File path (absolute or relative)'),
  project: z
    .string()
    .optional()
    .describe('Project name or ID (required for relative paths)'),
  generator: z
    .string()
    .describe('The generator name (e.g., @baseplate-dev/react-generators)'),
  templateName: z.string().describe('Template name in kebab-case format'),
});
const configureRawTemplateOutputSchema = z.object({
  message: z.string().describe('Success message'),
  templateName: z.string().describe('The configured template name'),
  absolutePath: z
    .string()
    .describe('The absolute file path that was configured'),
  generatorDirectory: z
    .string()
    .describe('The generator directory that was configured'),
});

export const configureRawTemplateMetadata = createServiceActionMetadata({
  name: 'configure-raw-template',
  title: 'Configure Raw Template',
  description: 'Configure a raw/binary template for copying files as-is',
  inputSchema: configureRawTemplateInputSchema,
  outputSchema: configureRawTemplateOutputSchema,
  scope: 'dev',
});
