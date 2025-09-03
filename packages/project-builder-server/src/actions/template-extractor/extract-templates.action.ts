import { z } from 'zod';

import { createServiceAction } from '#src/actions/types.js';

import { getProjectByNameOrId } from '../utils/projects.js';

const extractTemplatesInputSchema = {
  project: z
    .string()
    .describe('The name or ID of the project to extract templates from.'),
  app: z.string().describe('The app name to extract templates from.'),
  autoGenerateExtractor: z
    .boolean()
    .optional()
    .default(true)
    .describe('Auto-generate extractor.json files.'),
  skipClean: z
    .boolean()
    .optional()
    .default(false)
    .describe(
      'Skip cleaning the output directories (templates and generated).',
    ),
};

const extractTemplatesOutputSchema = {
  success: z
    .boolean()
    .describe('Whether the template extraction was successful.'),
  message: z.string().describe('Success message.'),
};

/**
 * Service action to extract templates from a project.
 */
export const extractTemplatesAction = createServiceAction({
  name: 'extract-templates',
  title: 'Extract Templates',
  description: 'Extract templates from the specified project and app',
  inputSchema: extractTemplatesInputSchema,
  outputSchema: extractTemplatesOutputSchema,
  handler: async (input, context) => {
    const { project: projectId, app, autoGenerateExtractor, skipClean } = input;
    const { projects, logger, plugins } = context;

    // Find the project by name or ID
    const project = getProjectByNameOrId(projects, projectId);

    logger.info(
      `Extracting templates from project: ${project.name}, app: ${app}`,
    );

    const { runTemplateExtractorsForProject } = await import(
      '../../template-extractor/run-template-extractor.js'
    );

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
