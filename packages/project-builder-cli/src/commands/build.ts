import type { Command } from 'commander';

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
      const { buildProject, SyncMetadataController } = await import(
        '@baseplate-dev/project-builder-server'
      );
      const resolvedDirectory = directory
        ? expandPathWithTilde(directory)
        : '.';
      const context = await createSchemaParserContext(resolvedDirectory);
      const userConfig = await getUserConfig();
      const syncMetadataController = new SyncMetadataController(
        resolvedDirectory,
        logger,
      );
      await buildProject({
        directory: resolvedDirectory,
        logger,
        context,
        userConfig,
        cliFilePath: process.argv[1],
        syncMetadataController,
      });
    });
}
