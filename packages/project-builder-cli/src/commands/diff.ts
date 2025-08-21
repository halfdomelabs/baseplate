import type { Command } from 'commander';

import { createSchemaParserContext } from '#src/services/schema-parser-context.js';
import { getUserConfig } from '#src/services/user-config.js';
import { resolveProject } from '#src/utils/project-resolver.js';

import { logger } from '../services/logger.js';

/**
 * Adds a diff command to the program.
 * @param program - The program to add the command to.
 */
export function addDiffCommand(program: Command): void {
  program
    .command('diff [project]')
    .description(
      'Show diff between generated output and project (name or directory)',
    )
    .option('--compact', 'Show compact diff format instead of unified diff')
    .option('--app <apps...>', 'Filter by specific app names')
    .option('--glob <patterns...>', 'Filter files by glob patterns')
    .option('--no-ignore-file', 'Disable .baseplateignore file filtering')
    .action(
      async (
        project: string | undefined,
        options: {
          compact?: boolean;
          app?: string[];
          glob?: string[];
          ignoreFile?: boolean;
        },
      ) => {
        try {
          const { diffProject } = await import(
            '@baseplate-dev/project-builder-server'
          );

          let resolvedDirectory: string;
          if (project) {
            const projectInfo = await resolveProject(project);
            resolvedDirectory = projectInfo.path;
            logger.info(`Running diff for project: ${projectInfo.name}`);
          } else {
            resolvedDirectory = process.cwd();
          }

          const context = await createSchemaParserContext(resolvedDirectory);
          const userConfig = await getUserConfig();

          await diffProject({
            directory: resolvedDirectory,
            logger,
            context,
            userConfig,
            compact: options.compact ?? false,
            appFilter: options.app,
            globPatterns: options.glob,
            useIgnoreFile: options.ignoreFile ?? true,
          });
        } catch (error) {
          logger.error(
            `Failed to run diff: ${error instanceof Error ? error.message : String(error)}`,
          );
          throw error;
        }
      },
    );
}
