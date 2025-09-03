import { z } from 'zod';

import { createServiceAction } from '#src/actions/types.js';

const variableSchema = z.object({
  description: z
    .string()
    .optional()
    .describe('Optional description for the variable'),
  value: z.string().min(1).describe('The value of the variable'),
});

const configureTextTemplateInputSchema = {
  filePath: z.string().describe('File path (absolute or relative)'),
  project: z
    .string()
    .optional()
    .describe('Project name or ID (required for relative paths)'),
  generator: z
    .string()
    .describe('The generator name (e.g., @baseplate-dev/react-generators)'),
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
  absolutePath: z
    .string()
    .describe('The absolute file path that was configured'),
  generatorDirectory: z
    .string()
    .describe('The generator directory that was configured'),
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
    const { filePath, project, generator, templateName, variables, group } =
      input;

    const { configureTextTemplate } = await import(
      '#src/templates/configure/configure-text-template.js'
    );

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
