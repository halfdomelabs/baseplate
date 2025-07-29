import type { Command } from 'commander';

import { confirm } from '@inquirer/prompts';

import { createSchemaParserContext } from '#src/services/schema-parser-context.js';
import { getUserConfig } from '#src/services/user-config.js';
import { expandPathWithTilde } from '#src/utils/path.js';

import { logger } from '../services/logger.js';

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
    .command('add <project-directory> <app> <files...>')
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
        projectDirectory: string,
        app: string,
        files: string[],
        options: {
          deleted?: boolean;
          snapshotDir?: string;
        },
      ) => {
        try {
          const { addFilesToSnapshot } = await import(
            '@baseplate-dev/project-builder-server'
          );

          const resolvedDirectory = expandPathWithTilde(projectDirectory);
          const context = await createSchemaParserContext(resolvedDirectory);

          await addFilesToSnapshot(files, !!options.deleted, {
            projectDirectory: resolvedDirectory,
            snapshotDirectory: options.snapshotDir,
            appName: app,
            context,
            logger,
          });
        } catch (error) {
          logger.error('Failed to add files to snapshot:', error);
          throw error;
        }
      },
    );

  // snapshot remove command
  snapshotCommand
    .command('remove <project-directory> <app> <files...>')
    .description('Remove files from snapshot tracking')
    .option(
      '--snapshot-dir <directory>',
      'Snapshot directory',
      '.baseplate-snapshot',
    )
    .action(
      async (
        projectDirectory: string,
        app: string,
        files: string[],
        options: {
          snapshotDir?: string;
        },
      ) => {
        try {
          const { removeFilesFromSnapshot } = await import(
            '@baseplate-dev/project-builder-server'
          );

          const resolvedDirectory = expandPathWithTilde(projectDirectory);
          const context = await createSchemaParserContext(resolvedDirectory);

          await removeFilesFromSnapshot(files, {
            projectDirectory: resolvedDirectory,
            snapshotDirectory: options.snapshotDir,
            appName: app,
            context,
            logger,
          });
        } catch (error) {
          logger.error('Failed to remove files from snapshot:', error);
          throw error;
        }
      },
    );

  // snapshot save command
  snapshotCommand
    .command('save <project-directory> <app>')
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
        projectDirectory: string,
        app: string,
        options: {
          snapshotDir?: string;
        },
      ) => {
        try {
          const { createSnapshotForProject } = await import(
            '@baseplate-dev/project-builder-server'
          );

          const resolvedDirectory = expandPathWithTilde(projectDirectory);
          const context = await createSchemaParserContext(resolvedDirectory);
          const userConfig = await getUserConfig();

          // Confirm with user before overwriting existing snapshot
          console.warn(
            '⚠️  This will overwrite any existing snapshot for this app.',
          );
          console.info(
            'Use granular commands (snapshot add/remove) for safer updates.',
          );
          const proceed: boolean = await confirm({
            message:
              'Are you sure you want to overwrite the existing snapshot?',
            default: false,
          });
          if (!proceed) {
            logger.info('Aborted snapshot save.');
            return;
          }

          await createSnapshotForProject({
            projectDirectory: resolvedDirectory,
            app,
            logger,
            context,
            userConfig,
            snapshotDir: options.snapshotDir,
          });

          logger.info('✅ Snapshot saved successfully');
        } catch (error) {
          logger.error('Failed to save snapshot:', error);
          throw error;
        }
      },
    );

  // snapshot show command
  snapshotCommand
    .command('show <project-directory> <app>')
    .description('Show current snapshot contents')
    .option(
      '--snapshot-dir <directory>',
      'Snapshot directory',
      '.baseplate-snapshot',
    )
    .action(
      async (
        projectDirectory: string,
        app: string,
        options: {
          snapshotDir?: string;
        },
      ) => {
        try {
          const { listSnapshotContents } = await import(
            '@baseplate-dev/project-builder-server'
          );

          const resolvedDirectory = expandPathWithTilde(projectDirectory);
          const context = await createSchemaParserContext(resolvedDirectory);

          await listSnapshotContents({
            projectDirectory: resolvedDirectory,
            appName: app,
            snapshotDirectory: options.snapshotDir,
            context,
            logger,
          });
        } catch (error) {
          logger.error('Failed to show snapshot contents:', error);
          throw error;
        }
      },
    );
}
