import { createServiceAction } from '#src/actions/types.js';

import { configureTextTemplateMetadata } from './configure-text-template.action-metadata.js';

/**
 * Service action to configure a text template
 */
export const configureTextTemplateAction = createServiceAction({
  ...configureTextTemplateMetadata,
  handler: async (input, context) => {
    const { filePath, project, generator, templateName, variables, group } =
      input;

    const { configureTextTemplate } =
      await import('#src/templates/configure/configure-text-template.js');

    // Configure the template using the dedicated function
    const result = await configureTextTemplate(
      {
        filePath,
        project,
        generator,
        templateName,
        variables,
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
