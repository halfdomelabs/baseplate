import { z } from 'zod';

import { createServiceAction } from '#src/actions/types.js';

import { getProjectByNameOrId } from '../utils/projects.js';

const discoverGeneratorsInputSchema = {
  project: z
    .string()
    .optional()
    .describe(
      'Optionally, specify the project to discover generators from. If not provided, uses current directory.',
    ),
};

const generatorInfoSchema = z.object({
  name: z.string().describe('The generator name'),
  packageName: z.string().describe('The generator package name'),
  packagePath: z.string().describe('The file system path to the package'),
  generatorDirectory: z.string().describe('The generator directory path'),
  templateCount: z.number().describe('Number of templates in the generator'),
});

export type GeneratorInfo = z.infer<typeof generatorInfoSchema>;

const discoverGeneratorsOutputSchema = {
  generators: z
    .array(generatorInfoSchema)
    .describe('List of discovered generators with their template information'),
};

/**
 * Service action to discover all available generators with extractor.json files.
 */
export const discoverGeneratorsAction = createServiceAction({
  name: 'discover-generators',
  title: 'Discover Generators',
  description: 'Discover all available generators with extractor.json files',
  inputSchema: discoverGeneratorsInputSchema,
  outputSchema: discoverGeneratorsOutputSchema,
  handler: async (input, context) => {
    const { project: projectId } = input;
    const { projects, logger, plugins } = context;

    // Determine the directory to discover generators from
    let directory = process.cwd();
    if (projectId) {
      const project = getProjectByNameOrId(projects, projectId);
      directory = project.directory;
    }

    logger.info('Discovering available generators');

    const { discoverGenerators } = await import(
      '../../template-extractor/discover-generators.js'
    );

    const generators = await discoverGenerators(directory, plugins, logger);

    return {
      generators,
    };
  },
  writeCliOutput: (output) => {
    const { generators } = output;
    console.info(`✓ Found ${generators.length} generator(s):`);

    for (const generator of generators) {
      console.info(`  • ${generator.name} (${generator.packageName})`);
      console.info(`    Templates: ${generator.templateCount}`);
      console.info(`    Path: ${generator.generatorDirectory}`);
    }
  },
});
