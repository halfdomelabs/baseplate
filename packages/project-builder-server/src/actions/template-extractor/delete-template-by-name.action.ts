import { createServiceAction } from '#src/actions/types.js';

import { deleteTemplateByNameMetadata } from './delete-template-by-name.action-metadata.js';

/**
 * Service action to delete a template by generator name and template name.
 */
export const deleteTemplateByNameAction = createServiceAction({
  ...deleteTemplateByNameMetadata,
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
