import { z } from 'zod';

import { createServiceAction } from '#src/actions/types.js';
import { configureRawTemplate } from '#src/templates/configure/configure-raw-template.js';

import { getProjectByNameOrId } from '../utils/projects.js';

const configureRawTemplateInputSchema = {
  project: z.string().describe('The name or ID of the project'),
  package: z.string().describe('The package name within the project'),
  generator: z
    .string()
    .describe('The generator name (e.g., @baseplate-dev/react-generators)'),
  file: z.string().describe('File path relative to the package directory'),
  templateName: z.string().describe('Template name in kebab-case format'),
  group: z.string().optional().describe('Optional template group'),
};

const configureRawTemplateOutputSchema = {
  message: z.string().describe('Success message'),
  templateName: z.string().describe('The configured template name'),
  filePath: z.string().describe('The file path that was configured'),
};

/**
 * Service action to configure a raw/binary template
 */
export const configureRawTemplateAction = createServiceAction({
  name: 'configure-raw-template',
  title: 'Configure Raw Template',
  description: 'Configure a raw/binary template for copying files as-is',
  inputSchema: configureRawTemplateInputSchema,
  outputSchema: configureRawTemplateOutputSchema,
  handler: async (input, context) => {
    const {
      project: projectId,
      package: packageName,
      generator,
      file: filePath,
      templateName,
      group,
    } = input;
    const { projects, plugins, logger } = context;

    // Find the project
    const project = getProjectByNameOrId(projects, projectId);

    // Configure the template using the dedicated function
    const result = await configureRawTemplate(
      {
        project,
        package: packageName,
        generator,
        filePath,
        templateName,
        group,
      },
      plugins,
      logger,
    );

    logger.info(result.message);
    return result;
  },
  writeCliOutput: (output) => {
    console.info(`✅ ${output.message}`);
  },
});
