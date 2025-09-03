import { z } from 'zod';

import { createServiceAction } from '#src/actions/types.js';
import { configureRawTemplate } from '#src/templates/configure/configure-raw-template.js';

const configureRawTemplateInputSchema = {
  filePath: z.string().describe('File path (absolute or relative)'),
  project: z
    .string()
    .optional()
    .describe('Project name or ID (required for relative paths)'),
  generator: z
    .string()
    .describe('The generator name (e.g., @baseplate-dev/react-generators)'),
  templateName: z.string().describe('Template name in kebab-case format'),
};

const configureRawTemplateOutputSchema = {
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
 * Service action to configure a raw/binary template
 */
export const configureRawTemplateAction = createServiceAction({
  name: 'configure-raw-template',
  title: 'Configure Raw Template',
  description: 'Configure a raw/binary template for copying files as-is',
  inputSchema: configureRawTemplateInputSchema,
  outputSchema: configureRawTemplateOutputSchema,
  handler: async (input, context) => {
    const { filePath, project, generator, templateName } = input;

    // Configure the template using the dedicated function
    const result = await configureRawTemplate(
      {
        filePath,
        project,
        generator,
        templateName,
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
