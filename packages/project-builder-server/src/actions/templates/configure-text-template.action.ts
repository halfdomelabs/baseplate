import { z } from 'zod';

import { createServiceAction } from '#src/actions/types.js';
import { configureTextTemplate } from '#src/templates/configure/configure-text-template.js';

import { getProjectByNameOrId } from '../utils/projects.js';

const variableSchema = z.object({
  description: z
    .string()
    .optional()
    .describe('Optional description for the variable'),
});

const configureTextTemplateInputSchema = {
  project: z.string().describe('The name or ID of the project'),
  package: z.string().describe('The package name within the project'),
  generator: z
    .string()
    .describe('The generator name (e.g., @baseplate-dev/react-generators)'),
  file: z.string().describe('File path relative to the package directory'),
  templateName: z.string().describe('Template name in kebab-case format'),
  variables: z
    .record(variableSchema)
    .optional()
    .describe('Object mapping variable names to their metadata'),
  group: z.string().optional().describe('Optional template group'),
};

const configureTextTemplateOutputSchema = {
  message: z.string().describe('Success message'),
  templateName: z.string().describe('The configured template name'),
  filePath: z.string().describe('The file path that was configured'),
};

/**
 * Service action to configure a text template
 */
export const configureTextTemplateAction = createServiceAction({
  name: 'configure-text-template',
  title: 'Configure Text Template',
  description: 'Configure a text template with variables for substitution',
  inputSchema: configureTextTemplateInputSchema,
  outputSchema: configureTextTemplateOutputSchema,
  handler: async (input, context) => {
    const {
      project: projectId,
      package: packageName,
      generator,
      file: filePath,
      templateName,
      variables = {},
      group,
    } = input;
    const { projects, plugins, logger } = context;

    // Find the project
    const project = getProjectByNameOrId(projects, projectId);

    // Configure the template using the dedicated function
    const result = await configureTextTemplate(
      {
        project,
        package: packageName,
        generator,
        filePath,
        templateName,
        variables,
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
