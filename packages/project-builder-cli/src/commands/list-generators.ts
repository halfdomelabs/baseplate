import type { Command } from 'commander';

import { getDefaultPlugins } from '@baseplate-dev/project-builder-common';

import { logger } from '#src/services/logger.js';
import { expandPathWithTilde } from '#src/utils/path.js';

interface ListGeneratorsOptions {
  json?: boolean;
}

/**
 * Adds a list-generators command to the program.
 * @param program - The program to add the command to.
 */
export function addListGeneratorsCommand(program: Command): void {
  program
    .command('list-generators [directory]')
    .description('Lists all available generators with extractor.json files')
    .option('--json', 'Output in JSON format', false)
    .action(
      async (directory: string | undefined, options: ListGeneratorsOptions) => {
        const { discoverGenerators } = await import(
          '@baseplate-dev/project-builder-server/template-extractor'
        );

        const resolvedDirectory = directory
          ? expandPathWithTilde(directory)
          : '.';
        const defaultPlugins = await getDefaultPlugins(logger);

        try {
          const generators = await discoverGenerators(
            resolvedDirectory,
            defaultPlugins,
            logger,
          );

          if (options.json) {
            console.info(JSON.stringify(generators, null, 2));
          } else {
            if (generators.length === 0) {
              console.info('No generators found with extractor.json files.');
              return;
            }

            console.info(`Found ${generators.length} generator(s):\n`);

            for (const generator of generators) {
              console.info(`📦 ${generator.name}`);
              console.info(`   Package: ${generator.packageName}`);
              console.info(`   Path: ${generator.generatorDirectory}`);
              console.info(`   Templates: ${generator.templateCount}`);
              console.info();
            }
          }
        } catch (error) {
          logger.error(
            `Failed to discover generators: ${error instanceof Error ? error.message : String(error)}`,
          );
          throw error;
        }
      },
    );
}
