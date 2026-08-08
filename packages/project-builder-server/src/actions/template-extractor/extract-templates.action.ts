import { createServiceAction } from '#src/actions/types.js';

import { getProjectByNameOrId } from '../utils/projects.js';
import { extractTemplatesMetadata } from './extract-templates.action-metadata.js';

/**
 * Service action to extract templates from a project.
 */
export const extractTemplatesAction = createServiceAction({
  ...extractTemplatesMetadata,
  handler: async (input, context) => {
    const { project: projectId, app, autoGenerateExtractor, skipClean } = input;
    const { projects, logger, plugins } = context;

    // Find the project by name or ID
    const project = getProjectByNameOrId(projects, projectId);

    logger.info(
      `Extracting templates from project: ${project.name}, app: ${app}`,
    );

    const { runTemplateExtractorsForProject } =
      await import('../../template-extractor/run-template-extractor.js');

    await runTemplateExtractorsForProject(
      project.directory,
      app,
      plugins,
      logger,
      {
        autoGenerateExtractor,
        skipClean,
      },
    );

    return {
      success: true,
      message: `Templates extracted successfully from ${project.name}/${app}`,
    };
  },
  writeCliOutput: (output) => {
    if (output.success) {
      console.info(`✓ ${output.message}`);
    } else {
      console.error(`✗ Template extraction failed`);
    }
  },
});
