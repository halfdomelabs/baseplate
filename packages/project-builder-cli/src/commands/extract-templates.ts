import type { Command } from 'commander';

import { getDefaultPlugins } from '@baseplate-dev/project-builder-common';

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
    .option(
      '--skip-clean',
      'Skip cleaning the output directories (templates and generated)',
      false,
    )
    .action(
      async (
        directory: string,
        app: string,
        options: {
          autoGenerateExtractor?: boolean;
          skipClean?: boolean;
        },
      ) => {
        const { runTemplateExtractorsForProject } = await import(
          '@baseplate-dev/project-builder-server/template-extractor'
        );
        const resolvedDirectory = expandPathWithTilde(directory);
        const defaultPlugins = await getDefaultPlugins(logger);
        await runTemplateExtractorsForProject(
          resolvedDirectory,
          app,
          defaultPlugins,
          logger,
          {
            autoGenerateExtractor: options.autoGenerateExtractor,
            skipClean: options.skipClean,
          },
        );
      },
    );
}
