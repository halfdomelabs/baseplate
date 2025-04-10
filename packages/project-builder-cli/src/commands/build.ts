import type { Command } from 'commander';

import { buildProjectForDirectory } from '@halfdomelabs/project-builder-server';

import { createSchemaParserContext } from '@src/services/schema-parser-context.js';
import { expandPathWithTilde } from '@src/utils/path.js';

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
      return buildProjectForDirectory({
        directory: resolvedDirectory,
        logger,
        context,
      });
    });
}
