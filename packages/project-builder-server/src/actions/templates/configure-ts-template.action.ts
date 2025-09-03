import { CASE_VALIDATORS } from '@baseplate-dev/utils';
import { z } from 'zod';

import { createServiceAction } from '#src/actions/types.js';
import { configureTsTemplate } from '#src/templates/configure/configure-ts-template.js';

const configureTsTemplateInputSchema = {
  filePath: z.string().describe('File path (absolute or relative)'),
  project: z
    .string()
    .optional()
    .describe('Project name or ID (required for relative paths)'),
  generator: z
    .string()
    .describe('The generator name (e.g., @baseplate-dev/react-generators)'),
  templateName: CASE_VALIDATORS.KEBAB_CASE.describe(
    'Template name in kebab-case format',
  ),
  group: CASE_VALIDATORS.KEBAB_CASE.optional().describe(
    'The group the template belongs to (optional)',
  ),
  projectExports: z
    .array(z.string())
    .optional()
    .describe('Array of identifiers to expose as exports for other generators'),
};

const configureTsTemplateOutputSchema = {
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
 * Service action to configure a TypeScript template
 */
export const configureTsTemplateAction = createServiceAction({
  name: 'configure-ts-template',
  title: 'Configure TypeScript Template',
  description:
    'Configure a TypeScript template with project exports and validation',
  inputSchema: configureTsTemplateInputSchema,
  outputSchema: configureTsTemplateOutputSchema,
  handler: async (input, context) => {
    const {
      filePath,
      project,
      generator,
      templateName,
      projectExports = [],
      group,
    } = input;

    // Configure the template using the dedicated function
    const result = await configureTsTemplate(
      {
        filePath,
        project,
        generator,
        templateName,
        projectExports,
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
