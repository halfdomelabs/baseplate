import { createServiceAction } from '#src/actions/types.js';

import { getProjectByNameOrId } from '../utils/projects.js';
import { generateTemplatesMetadata } from './generate-templates.action-metadata.js';

/**
 * Service action to generate typed template files from existing extractor.json configurations.
 */
export const generateTemplatesAction = createServiceAction({
  ...generateTemplatesMetadata,
  handler: async (input, context) => {
    const { project: projectId, skipClean } = input;
    const { projects, logger, plugins } = context;

    // Determine the directory to generate for
    let directory: string | undefined;
    if (projectId) {
      const project = getProjectByNameOrId(projects, projectId);
      directory = project.directory;
    }
    logger.info('Generating typed template files');

    const { generateTypedTemplateFiles } =
      await import('../../template-extractor/run-template-extractor.js');

    await generateTypedTemplateFiles(directory, plugins, logger, {
      skipClean,
    });

    return {
      success: true,
      message: `Typed template files generated successfully`,
    };
  },
  writeCliOutput: (output) => {
    if (output.success) {
      console.info(`✓ ${output.message}`);
    } else {
      console.error(`✗ Template generation failed`);
    }
  },
});
