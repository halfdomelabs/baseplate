import type { Command } from 'commander';

import { runTemplateExtractorsForDirectory } from '@halfdomelabs/project-builder-server';

import { logger } from '@src/services/logger.js';
import { createSchemaParserContext } from '@src/services/schema-parser-context.js';
import { expandPathWithTilde } from '@src/utils/path.js';

/**
 * Runs the template extraction flow on the target directory.
 *
 * @param program - The program to add the command to.
 */
export function addExtractCommand(program: Command): void {
  program
    .command('generate [directory]')
    .description(
      'Extracts templates from the specified directory and saves them to the templates directory',
    )
    .action(async (directory: string | undefined) => {
      const resolvedDirectory = directory
        ? expandPathWithTilde(directory)
        : '.';
      const context = await createSchemaParserContext(resolvedDirectory);
      await runTemplateExtractorsForDirectory(
        resolvedDirectory,
        context,
        logger,
      );
    });
}
