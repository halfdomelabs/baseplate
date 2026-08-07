import { createServiceAction } from '#src/actions/types.js';

import { configureRawTemplateMetadata } from './configure-raw-template.action-metadata.js';

/**
 * Service action to configure a raw/binary template
 */
export const configureRawTemplateAction = createServiceAction({
  ...configureRawTemplateMetadata,
  handler: async (input, context) => {
    const { filePath, project, generator, templateName } = input;

    const { configureRawTemplate } =
      await import('#src/templates/configure/configure-raw-template.js');

    // Configure the template using the dedicated function
    const result = await configureRawTemplate(
      {
        filePath,
        project,
        generator,
        templateName,
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
