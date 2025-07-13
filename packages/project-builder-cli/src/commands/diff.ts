import type { Command } from 'commander';

import { createSchemaParserContext } from '#src/services/schema-parser-context.js';
import { getUserConfig } from '#src/services/user-config.js';
import { expandPathWithTilde } from '#src/utils/path.js';

import { logger } from '../services/logger.js';

/**
 * Adds a diff command to the program.
 * @param program - The program to add the command to.
 */
export function addDiffCommand(program: Command): void {
  program
    .command('diff [directory]')
    .description(
      'Shows diff between generated output and current working directory',
    )
    .option('--compact', 'Show compact diff format instead of unified diff')
    .option('--app <apps...>', 'Filter by specific app names')
    .option('--glob <patterns...>', 'Filter files by glob patterns')
    .option('--no-ignore-file', 'Disable .baseplateignore file filtering')
    .action(
      async (
        directory: string | undefined,
        options: {
          compact?: boolean;
          app?: string[];
          glob?: string[];
          ignoreFile?: boolean;
        },
      ) => {
        const { diffProject } = await import(
          '@baseplate-dev/project-builder-server'
        );
        const resolvedDirectory = directory
          ? expandPathWithTilde(directory)
          : process.cwd();
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
      },
    );
}
