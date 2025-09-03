import { CASE_VALIDATORS } from '@baseplate-dev/utils';
import { z } from 'zod';

import { createServiceAction } from '#src/actions/types.js';
import { configureTsTemplate } from '#src/templates/configure/configure-ts-template.js';

import { getProjectByNameOrId } from '../utils/projects.js';

const configureTsTemplateInputSchema = {
  project: z.string().describe('The name or ID of the project'),
  package: z.string().describe('The package name within the project'),
  generator: z
    .string()
    .describe('The generator name (e.g., @baseplate-dev/react-generators)'),
  file: z.string().describe('File path relative to the package directory'),
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
  filePath: z.string().describe('The file path that was configured'),
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
      project: projectId,
      package: packageName,
      generator,
      file: filePath,
      templateName,
      projectExports = [],
      group,
    } = input;
    const { projects, plugins, logger } = context;

    // Find the project
    const project = getProjectByNameOrId(projects, projectId);

    // Configure the template using the dedicated function
    const result = await configureTsTemplate(
      {
        project,
        package: packageName,
        generator,
        filePath,
        templateName,
        projectExports,
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
