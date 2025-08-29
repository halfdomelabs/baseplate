import { z } from 'zod';

import { createServiceAction } from '#src/actions/types.js';

import { getProjectByNameOrId } from '../utils/projects.js';

const generateTemplatesInputSchema = {
  project: z
    .string()
    .optional()
    .describe(
      'Optionally, specify the project to source the generators from. If not, it will use the default set of plugins.',
    ),
  skipClean: z
    .boolean()
    .optional()
    .default(false)
    .describe(
      'Skip cleaning the output directories (templates and generated).',
    ),
};

const generateTemplatesOutputSchema = {
  success: z
    .boolean()
    .describe('Whether the template generation was successful.'),
  message: z.string().describe('Success message.'),
};

/**
 * Service action to generate typed template files from existing extractor.json configurations.
 */
export const generateTemplatesAction = createServiceAction({
  name: 'generate-templates',
  title: 'Generate Templates',
  description:
    'Generate typed template files from existing extractor.json configurations',
  inputSchema: generateTemplatesInputSchema,
  outputSchema: generateTemplatesOutputSchema,
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

    const { generateTypedTemplateFiles } = await import(
      '../../template-extractor/run-template-extractor.js'
    );

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
