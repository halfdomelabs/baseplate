import type { Command } from 'commander';

import { runTemplateExtractorsForProject } from '@halfdomelabs/project-builder-server';

import { logger } from '@src/services/logger.js';
import { createSchemaParserContext } from '@src/services/schema-parser-context.js';
import { expandPathWithTilde } from '@src/utils/path.js';

/**
 * Runs the template extraction flow on the target directory.
 *
 * @param program - The program to add the command to.
 */
export function addExtractTemplatesCommand(program: Command): void {
  program
    .command('extract-templates directory')
    .description(
      'Extracts templates from the specified directory and saves them to the templates directory',
    )
    .action(async (directory: string) => {
      const resolvedDirectory = expandPathWithTilde(directory);
      const context = await createSchemaParserContext(resolvedDirectory);
      await runTemplateExtractorsForProject(resolvedDirectory, context, logger);
    });
}
