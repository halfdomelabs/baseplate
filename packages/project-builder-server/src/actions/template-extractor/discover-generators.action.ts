import { createServiceAction } from '#src/actions/types.js';

import { getProjectByNameOrId } from '../utils/projects.js';
import { discoverGeneratorsMetadata } from './discover-generators.action-metadata.js';

/**
 * Service action to discover all available generators with extractor.json files.
 */
export const discoverGeneratorsAction = createServiceAction({
  ...discoverGeneratorsMetadata,
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

    const { discoverGenerators } =
      await import('../../template-extractor/discover-generators.js');

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
