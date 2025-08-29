import { z } from 'zod';

import { createServiceAction } from '#src/actions/types.js';

import { getProjectByNameOrId } from '../utils/projects.js';

const deleteTemplateInputSchema = {
  generatorName: z
    .string()
    .describe('The name of the generator containing the template.'),
  templateName: z.string().describe('The name of the template to delete.'),
  project: z
    .string()
    .optional()
    .describe(
      'Optionally, specify the project to source the generators from. If not, it will use the default set of plugins.',
    ),
};

const deleteTemplateOutputSchema = {
  success: z
    .boolean()
    .describe('Whether the template deletion was successful.'),
  message: z.string().describe('Success or error message.'),
};

/**
 * Service action to delete a specific template from a generator.
 */
export const deleteTemplateAction = createServiceAction({
  name: 'delete-template',
  title: 'Delete Template',
  description: 'Delete a specific template from a generator',
  inputSchema: deleteTemplateInputSchema,
  outputSchema: deleteTemplateOutputSchema,
  handler: async (input, context) => {
    const { generatorName, templateName, project: projectId } = input;
    const { projects, logger, plugins } = context;

    // Determine the directory to search
    let directory: string | undefined;
    if (projectId) {
      const project = getProjectByNameOrId(projects, projectId);
      directory = project.directory;
    }
    logger.info(
      `Deleting template '${templateName}' from generator '${generatorName}'`,
    );

    const { deleteTemplate } = await import(
      '../../template-extractor/delete-template.js'
    );

    await deleteTemplate(generatorName, templateName, {
      defaultPlugins: plugins,
      directory,
      logger,
    });

    return {
      success: true,
      message: `Template '${templateName}' deleted successfully from generator '${generatorName}'`,
    };
  },
  writeCliOutput: (output) => {
    if (output.success) {
      console.info(`✓ ${output.message}`);
    } else {
      console.error(`✗ ${output.message}`);
    }
  },
});
