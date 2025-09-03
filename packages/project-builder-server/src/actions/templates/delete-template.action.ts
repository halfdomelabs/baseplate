import { z } from 'zod';

import { createServiceAction } from '#src/actions/types.js';

const deleteTemplateInputSchema = {
  generatorDirectory: z
    .string()
    .describe('The directory path containing the generator'),
  templateName: z.string().describe('The name of the template to delete'),
};

const deleteTemplateOutputSchema = {
  success: z.boolean().describe('Whether the operation was successful'),
  message: z.string().describe('Success or error message'),
  generatorDirectory: z.string().describe('The generator directory used'),
  templateName: z.string().describe('The template name deleted'),
};

/**
 * Service action to delete a template from a generator
 */
export const deleteTemplateAction = createServiceAction({
  name: 'delete-template',
  title: 'Delete Template',
  description:
    'Delete a template from a generator by removing it from extractor.json and deleting the template file',
  inputSchema: deleteTemplateInputSchema,
  outputSchema: deleteTemplateOutputSchema,
  handler: async (input, context) => {
    const { generatorDirectory, templateName } = input;
    const { logger } = context;

    const { deleteTemplate } = await import(
      '../../templates/delete/delete-template.js'
    );

    await deleteTemplate({
      generatorDirectory,
      templateName,
    });

    const message = `Successfully deleted template '${templateName}' from generator at ${generatorDirectory}`;
    logger.info(message);

    return {
      success: true,
      message,
      generatorDirectory,
      templateName,
    };
  },
  writeCliOutput: (output) => {
    console.info(`✅ ${output.message}`);
  },
});
