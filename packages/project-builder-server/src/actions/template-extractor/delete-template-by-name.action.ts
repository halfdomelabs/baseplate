import { z } from 'zod';

import { createServiceAction } from '#src/actions/types.js';

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

/**
 * Service action to delete a template by generator name and template name.
 */
export const deleteTemplateByNameAction = createServiceAction({
  name: 'delete-template-by-name',
  title: 'Delete Template by Name',
  description:
    'Delete a specific template from a generator by generator name and template name',
  inputSchema: deleteTemplateByNameInputSchema,
  outputSchema: deleteTemplateByNameOutputSchema,
  handler: async (input, context) => {
    const { generatorName, templateName, directory } = input;
    const { logger, plugins } = context;

    const { deleteTemplate } =
      await import('../../template-extractor/delete-template.js');

    await deleteTemplate(generatorName, templateName, {
      defaultPlugins: plugins,
      logger,
      directory,
    });

    return {
      success: true,
      message: `Successfully deleted template '${templateName}' from generator '${generatorName}'`,
    };
  },
  writeCliOutput: (output) => {
    console.info(`\u2705 ${output.message}`);
  },
});
