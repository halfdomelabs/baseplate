import { createServiceAction } from '#src/actions/types.js';

import { configureTsTemplateMetadata } from './configure-ts-template.action-metadata.js';

/**
 * Service action to configure a TypeScript template
 */
export const configureTsTemplateAction = createServiceAction({
  ...configureTsTemplateMetadata,
  handler: async (input, context) => {
    const {
      filePath,
      project,
      generator,
      templateName,
      projectExports = [],
      group,
    } = input;

    const { configureTsTemplate } =
      await import('#src/templates/configure/configure-ts-template.js');

    // Configure the template using the dedicated function
    const result = await configureTsTemplate(
      {
        filePath,
        project,
        generator,
        templateName,
        projectExports,
        group,
      },
      context,
    );

    context.logger.info(result.message);
    return result;
  },
  writeCliOutput: (output) => {
    console.info(`✅ ${output.message}`);
  },
});
