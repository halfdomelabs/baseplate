import { createServiceAction } from '#src/actions/types.js';

import { showTemplateMetadataMetadata } from './show-template-metadata.action-metadata.js';

/**
 * Service action to show template metadata for a file
 */
export const showTemplateMetadataAction = createServiceAction({
  ...showTemplateMetadataMetadata,
  handler: async (input, context) => {
    const { filePath, project } = input;

    const { showTemplateMetadata } =
      await import('../../templates/show/show-template-metadata.js');

    const result = await showTemplateMetadata(
      {
        filePath,
        project,
      },
      context,
    );

    return result;
  },
  writeCliOutput: (output) => {
    if (output.hasMetadata) {
      console.info(`📄 ${output.message}`);
      console.info(`  Template: ${output.templateName}`);
      console.info(`  Generator: ${output.generator}`);
      if (output.instanceData && Object.keys(output.instanceData).length > 0) {
        console.info(
          `  Instance Data: ${JSON.stringify(output.instanceData, null, 2)}`,
        );
      }
    } else {
      console.info(`ℹ️  ${output.message}`);
      console.info(
        '  Use configure-ts-template, configure-text-template, or configure-raw-template to add metadata',
      );
    }
  },
});
