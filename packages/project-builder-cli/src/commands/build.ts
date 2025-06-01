import type { Command } from 'commander';

import { buildProject } from '@baseplate-dev/project-builder-server';

import { createSchemaParserContext } from '#src/services/schema-parser-context.js';
import { getUserConfig } from '#src/services/user-config.js';
import { expandPathWithTilde } from '#src/utils/path.js';

import { logger } from '../services/logger.js';

/**
 * Adds a build command to the program.
 * @param program - The program to add the command to.
 */
export function addBuildCommand(program: Command): void {
  program
    .command('generate [directory]')
    .description(
      'Builds project from project-definition.json in baseplate/ directory',
    )
    .action(async (directory: string | undefined) => {
      const resolvedDirectory = directory
        ? expandPathWithTilde(directory)
        : '.';
      const context = await createSchemaParserContext(resolvedDirectory);
      const userConfig = await getUserConfig();
      await buildProject({
        directory: resolvedDirectory,
        logger,
        context,
        userConfig,
      });
    });
}
