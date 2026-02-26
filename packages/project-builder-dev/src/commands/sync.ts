import type { Command } from 'commander';

import {
  invokeServiceActionAsCli,
  syncProjectAction,
} from '@baseplate-dev/project-builder-server/actions';

import { createServiceActionContext } from '#src/utils/create-service-action-context.js';

/**
 * Adds a sync command to the program.
 * @param program - The program to add the command to.
 */
export function addSyncCommand(program: Command): void {
  program
    .command('sync [project]')
    .description(
      'Syncs project from project-definition.json in baseplate/ directory',
    )
    .option(
      '--overwrite',
      'Force overwrite existing files and apply snapshots automatically',
    )
    .option(
      '--snapshot <directory>',
      'Apply diffs from snapshot directory (requires --overwrite)',
    )
    .option('--packages <packages...>', 'Only sync specific packages by name.')
    .action(
      async (
        project: string | undefined,
        options: {
          overwrite?: boolean;
          snapshot?: string;
          packages?: string[];
        },
      ) => {
        if (options.snapshot && !options.overwrite) {
          throw new Error('--snapshot requires --overwrite');
        }

        const context = await createServiceActionContext();
        const projectWithDefault =
          project ??
          (context.projects.length > 0 ? context.projects[0].name : undefined);

        if (!projectWithDefault) {
          throw new Error('No project specified');
        }

        await invokeServiceActionAsCli(
          syncProjectAction,
          {
            project: projectWithDefault,
            overwrite: options.overwrite,
            snapshotDirectory: options.snapshot,
            packages: options.packages,
          },
          context,
        );
      },
    );
}
