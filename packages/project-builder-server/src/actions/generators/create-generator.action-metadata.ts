import { z } from 'zod';

import { createServiceActionMetadata } from '#src/actions/types.js';

const generatorNameSchema = z
  .string()
  .regex(
    /^[a-z][a-z0-9-]*\/[a-z][a-z0-9-]*$/,
    'Generator name must be in format "category/name" using kebab-case (e.g., "email/sendgrid")',
  );
const createGeneratorInputSchema = z.object({
  name: generatorNameSchema.describe(
    'Generator name in format "category/name" (e.g., "email/sendgrid")',
  ),
  directory: z
    .string()
    .describe(
      'Directory to create generator in (e.g., "packages/fastify-generators/src/generators")',
    ),
  includeTemplates: z
    .boolean()
    .default(true)
    .describe('Include placeholder template setup'),
});
const createGeneratorOutputSchema = z.object({
  message: z.string().describe('Success message'),
  generatorName: z.string().describe('The created generator name'),
  generatorPath: z.string().describe('The path to the created generator'),
  filesCreated: z.array(z.string()).describe('List of files created'),
});

export const createGeneratorMetadata = createServiceActionMetadata({
  name: 'create-generator',
  title: 'Create Generator',
  description:
    'Create a new generator with boilerplate code, including generator file, index, and optional template setup',
  inputSchema: createGeneratorInputSchema,
  outputSchema: createGeneratorOutputSchema,
  scope: 'dev',
});
