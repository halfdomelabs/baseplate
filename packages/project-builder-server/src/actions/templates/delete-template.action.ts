import { createServiceAction } from '#src/actions/types.js';

import { deleteTemplateMetadata } from './delete-template.action-metadata.js';

/**
 * Service action to delete a template by file path
 */
export const deleteTemplateAction = createServiceAction({
  ...deleteTemplateMetadata,
  handler: async (input, context) => {
    const { filePath, project } = input;
    const { logger } = context;

    const { deleteTemplate } =
      await import('../../templates/delete/delete-template.js');

    const result = await deleteTemplate(
      {
        filePath,
        project,
      },
      context,
    );

    logger.info(result.message);

    return {
      success: true,
      message: result.message,
      templateName: result.templateName,
      absolutePath: result.absolutePath,
      generatorDirectory: result.generatorDirectory,
    };
  },
  writeCliOutput: (output) => {
    console.info(`✅ ${output.message}`);
  },
});
