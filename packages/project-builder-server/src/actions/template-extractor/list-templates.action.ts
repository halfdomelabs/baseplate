import { z } from 'zod';

import { createServiceAction } from '#src/actions/types.js';

import { getProjectByNameOrId } from '../utils/projects.js';

const listTemplatesInputSchema = {
  project: z
    .string()
    .optional()
    .describe(
      'Optionally, specify the project to source the generators from. If not, it will use the default set of plugins.',
    ),
};

const templateConfigSchema = z.object({
  sourceFile: z.string().describe('The source file path for the template.'),
  extractedPath: z
    .string()
    .optional()
    .describe('The extracted path for the template.'),
  templateVariables: z
    .record(z.any())
    .optional()
    .describe('Template variables configuration.'),
});

const generatorInfoSchema = z.object({
  name: z.string().describe('The name of the generator.'),
  packageName: z.string().describe('The package name of the generator.'),
  packagePath: z.string().describe('The file system path to the package.'),
  generatorDirectory: z
    .string()
    .describe('The directory containing the generator.'),
  templates: z
    .record(templateConfigSchema)
    .describe('The templates in this generator.'),
  templateCount: z
    .number()
    .describe('The number of templates in this generator.'),
});

const listTemplatesOutputSchema = {
  generators: z
    .array(generatorInfoSchema)
    .describe('List of available generators with their templates.'),
  totalGenerators: z.number().describe('Total number of generators found.'),
  totalTemplates: z
    .number()
    .describe('Total number of templates across all generators.'),
};

/**
 * Service action to list all available generators with their templates.
 */
export const listTemplatesAction = createServiceAction({
  name: 'list-templates',
  title: 'List Templates',
  description: 'List all available generators with their templates',
  inputSchema: listTemplatesInputSchema,
  outputSchema: listTemplatesOutputSchema,
  handler: async (input, context) => {
    const { project: projectId } = input;
    const { projects, logger, plugins } = context;

    // Determine the directory to search
    let directory: string | undefined;
    if (projectId) {
      const project = getProjectByNameOrId(projects, projectId);
      directory = project.directory;
      logger.info(`Listing templates for project: ${project.name}`);
    } else {
      logger.info('Listing templates for the default set of generators');
    }

    const { discoverGenerators } = await import(
      '../../template-extractor/discover-generators.js'
    );

    const generators = await discoverGenerators(directory, plugins, logger);

    const totalTemplates = generators.reduce(
      (sum, gen) => sum + gen.templateCount,
      0,
    );

    return {
      generators,
      totalGenerators: generators.length,
      totalTemplates,
    };
  },
  writeCliOutput: (output) => {
    if (output.totalGenerators === 0) {
      console.info('No generators found.');
      return;
    }

    console.info(
      `Found ${output.totalGenerators} generator(s) with ${output.totalTemplates} template(s) total:\n`,
    );

    for (const generator of output.generators) {
      console.info(`📦 ${generator.name} (${generator.packageName})`);
      console.info(`   Directory: ${generator.generatorDirectory}`);
      console.info(`   Templates: ${generator.templateCount}`);

      if (generator.templateCount > 0) {
        for (const [templateName, templateConfig] of Object.entries(
          generator.templates,
        )) {
          console.info(`   └─ ${templateName} → ${templateConfig.sourceFile}`);
        }
      }
      console.info('');
    }
  },
});
