import type { Command } from 'commander';

import { logger } from '#src/services/logger.js';
import { expandPathWithTilde } from '#src/utils/path.js';

/**
 * Runs the template extraction flow on the target directory.
 *
 * @param program - The program to add the command to.
 */
export function addExtractTemplatesCommand(program: Command): void {
  program
    .command('extract-templates directory app')
    .description(
      'Extracts templates from the specified directory and saves them to the templates directory',
    )
    .option(
      '--auto-generate-extractor',
      'Auto-generate extractor.json files',
      true,
    )
    .action(
      async (
        directory: string,
        app: string,
        options: { autoGenerateExtractor?: boolean },
      ) => {
        const { runTemplateExtractorsForProjectV2 } = await import(
          '@baseplate-dev/project-builder-server/template-extractor'
        );
        const resolvedDirectory = expandPathWithTilde(directory);
        await runTemplateExtractorsForProjectV2(
          resolvedDirectory,
          app,
          logger,
          {
            autoGenerateExtractor: options.autoGenerateExtractor,
          },
        );
      },
    );
}
