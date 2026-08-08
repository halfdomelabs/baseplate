import { createServiceAction } from '#src/actions/types.js';

import { listTemplatesMetadata } from './list-templates.action-metadata.js';

/**
 * Service action to list templates in a specific generator
 */
export const listTemplatesAction = createServiceAction({
  ...listTemplatesMetadata,
  handler: async (input, context) => {
    const { generatorDirectory } = input;
    const { logger } = context;

    const { listTemplates } =
      await import('../../templates/list/list-templates.js');

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
