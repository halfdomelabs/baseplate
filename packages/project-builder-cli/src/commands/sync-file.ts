import type { Command } from 'commander';

import { invokeServiceActionAsCli } from '@baseplate-dev/project-builder-server/actions';

import { createServiceActionContext } from '#src/utils/create-service-action-context.js';

import { logger } from '../services/logger.js';

/**
 * Adds a sync-file command to the program.
 * @param program - The program to add the command to.
 */
export function addSyncFileCommand(program: Command): void {
  program
    .command('sync-file <project> <app> <files...>')
    .description(
      'Apply specific generated files to the working codebase without performing a full sync',
    )
    .action(async (project: string, app: string, files: string[]) => {
      try {
        const context = await createServiceActionContext();

        // Imported dynamically so the action handlers (and their generator
        // dependencies) stay off the startup path of every CLI command.
        const { syncFileAction } =
          await import('@baseplate-dev/project-builder-server/actions/definitions');

        await invokeServiceActionAsCli(
          syncFileAction,
          {
            project,
            app,
            files,
          },
          context,
        );
      } catch (error) {
        logger.error(error, 'Failed to sync files');
        throw error;
      }
    });
}
