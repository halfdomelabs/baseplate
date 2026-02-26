import type { Command } from 'commander';

import {
  invokeServiceActionAsCli,
  snapshotAddAction,
  snapshotRemoveAction,
  snapshotSaveAction,
  snapshotShowAction,
} from '@baseplate-dev/project-builder-server/actions';
import { confirm } from '@inquirer/prompts';

import { logger } from '#src/services/logger.js';
import { createServiceActionContext } from '#src/utils/create-service-action-context.js';

/**
 * Adds snapshot management commands to the program.
 * @param program - The program to add the command to.
 */
export function addSnapshotCommand(program: Command): void {
  const snapshotCommand = program
    .command('snapshot')
    .description('Manage project snapshots for persistent differences');

  // snapshot add command
  snapshotCommand
    .command('add <project> <app> <files...>')
    .description(
      'Add files to snapshot (use --deleted for intentionally deleted files)',
    )
    .option('--deleted', 'Mark files as intentionally deleted in snapshot')
    .option(
      '--snapshot-dir <directory>',
      'Snapshot directory',
      '.baseplate-snapshot',
    )
    .action(
      async (
        project: string,
        app: string,
        files: string[],
        options: {
          deleted?: boolean;
          snapshotDir?: string;
        },
      ) => {
        try {
          const context = await createServiceActionContext();

          await invokeServiceActionAsCli(
            snapshotAddAction,
            {
              project,
              app,
              files,
              deleted: options.deleted,
            },
            context,
          );
        } catch (error) {
          logger.error('Failed to add files to snapshot:', error);
          throw error;
        }
      },
    );

  // snapshot remove command
  snapshotCommand
    .command('remove <project> <app> <files...>')
    .description('Remove files from snapshot tracking')
    .option(
      '--snapshot-dir <directory>',
      'Snapshot directory',
      '.baseplate-snapshot',
    )
    .action(
      async (
        project: string,
        app: string,
        files: string[],
        options: {
          snapshotDir?: string;
        },
      ) => {
        try {
          const context = await createServiceActionContext();

          await invokeServiceActionAsCli(
            snapshotRemoveAction,
            {
              project,
              app,
              files,
              snapshotDirectory: options.snapshotDir,
            },
            context,
          );
        } catch (error) {
          logger.error('Failed to remove files from snapshot:', error);
          throw error;
        }
      },
    );

  // snapshot save command
  snapshotCommand
    .command('save <project> <app>')
    .description(
      'Save snapshot of current differences (overwrites existing snapshot)',
    )
    .option(
      '--snapshot-dir <directory>',
      'Snapshot directory',
      '.baseplate-snapshot',
    )
    .action(
      async (
        project: string,
        app: string,
        options: {
          snapshotDir?: string;
        },
      ) => {
        // Confirm with user before overwriting existing snapshot
        console.warn(
          '⚠️  This will overwrite any existing snapshot for this app.',
        );
        console.info(
          'Use granular commands (snapshot add/remove) for safer updates.',
        );
        const proceed: boolean = await confirm({
          message: 'Are you sure you want to overwrite the existing snapshot?',
          default: false,
        });
        if (!proceed) {
          logger.info('Aborted snapshot save.');
          return;
        }

        const context = await createServiceActionContext();

        await invokeServiceActionAsCli(
          snapshotSaveAction,
          {
            project,
            app,
            snapshotDirectory: options.snapshotDir,
          },
          context,
        );
      },
    );

  // snapshot show command
  snapshotCommand
    .command('show <project> <app>')
    .description('Show current snapshot contents')
    .option(
      '--snapshot-dir <directory>',
      'Snapshot directory',
      '.baseplate-snapshot',
    )
    .action(
      async (
        project: string,
        app: string,
        options: {
          snapshotDir?: string;
        },
      ) => {
        const context = await createServiceActionContext();

        await invokeServiceActionAsCli(
          snapshotShowAction,
          {
            project,
            app,
            snapshotDirectory: options.snapshotDir,
          },
          context,
        );
      },
    );
}
