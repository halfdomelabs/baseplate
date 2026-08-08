import { createServiceAction } from '#src/actions/types.js';

import { createGeneratorMetadata } from './create-generator.action-metadata.js';

/**
 * Service action to create a new generator with boilerplate code
 */
export const createGeneratorAction = createServiceAction({
  ...createGeneratorMetadata,
  handler: async (input, context) => {
    const { name, directory, includeTemplates } = input;

    const { createGenerator } =
      await import('#src/templates/create/create-generator.js');

    const result = createGenerator({
      name,
      directory,
      includeTemplates,
    });

    context.logger.info(result.message);
    return result;
  },
  writeCliOutput: (output) => {
    console.info(`✅ ${output.message}`);
    console.info(`📁 Generator path: ${output.generatorPath}`);
    if (output.filesCreated.length > 0) {
      console.info(`📄 Files created:`);
      for (const file of output.filesCreated) {
        console.info(`   - ${file}`);
      }
    }
  },
});
