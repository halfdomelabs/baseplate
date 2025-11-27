import { z } from 'zod';

import { createServiceAction } from '#src/actions/types.js';

const listTemplatesInputSchema = {
  generatorDirectory: z
    .string()
    .describe('The directory path containing the generator'),
};

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

const listTemplatesOutputSchema = {
  message: z.string().describe('Success message'),
  generatorName: z.string().describe('The name of the generator'),
  generatorDirectory: z.string().describe('The generator directory'),
  templates: z.array(templateInfoSchema).describe('List of templates'),
  templateCount: z.number().describe('Total number of templates'),
};

/**
 * Service action to list templates in a specific generator
 */
export const listTemplatesAction = createServiceAction({
  name: 'list-templates',
  title: 'List Templates in Generator',
  description: 'List all templates in a specific generator directory',
  inputSchema: listTemplatesInputSchema,
  outputSchema: listTemplatesOutputSchema,
  handler: async (input, context) => {
    const { generatorDirectory } = input;
    const { logger } = context;

    const { listTemplates } = await import(
      '../../templates/list/list-templates.js'
    );

    const result = await listTemplates({
      generatorDirectory,
    });

    const message = `Found ${result.templateCount} template(s) in generator '${result.generatorName}'`;
    logger.info(message);

    return {
      message,
      generatorName: result.generatorName,
      generatorDirectory,
      templates: result.templates,
      templateCount: result.templateCount,
    };
  },
  writeCliOutput: (output) => {
    console.info(`📦 ${output.generatorName}`);
    console.info(`   Directory: ${output.generatorDirectory}`);
    console.info(`   Templates: ${output.templateCount}`);

    if (output.templateCount > 0) {
      for (const template of output.templates) {
        const sourceInfo = template.sourceFile
          ? ` → ${template.sourceFile}`
          : '';
        console.info(`   └─ ${template.name} (${template.type})${sourceInfo}`);
      }
    }
  },
});
