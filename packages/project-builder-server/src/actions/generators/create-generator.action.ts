import { z } from 'zod';

import { createServiceAction } from '#src/actions/types.js';

// Custom regex for generator names: category/kebab-name format
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

/**
 * Service action to create a new generator with boilerplate code
 */
export const createGeneratorAction = createServiceAction({
  name: 'create-generator',
  title: 'Create Generator',
  description:
    'Create a new generator with boilerplate code, including generator file, index, and optional template setup',
  inputSchema: createGeneratorInputSchema,
  outputSchema: createGeneratorOutputSchema,
  handler: async (input, context) => {
    const { name, directory, includeTemplates } = input;

    const { createGenerator } =
      await import('#src/templates/create/create-generator.js');

    const result = createGenerator({
      name,
      directory,
      includeTemplates,
    });

    context.logger.info(result.message);
    return result;
  },
  writeCliOutput: (output) => {
    console.info(`✅ ${output.message}`);
    console.info(`📁 Generator path: ${output.generatorPath}`);
    if (output.filesCreated.length > 0) {
      console.info(`📄 Files created:`);
      for (const file of output.filesCreated) {
        console.info(`   - ${file}`);
      }
    }
  },
});
