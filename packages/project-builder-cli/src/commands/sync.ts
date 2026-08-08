import type { Command } from 'commander';

import { invokeServiceActionAsCli } from '@baseplate-dev/project-builder-server/actions';

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
    .option('--packages <packages...>', 'Only sync specific packages by name.')
    .action(
      async (
        project: string | undefined,
        options: {
          packages?: string[];
        },
      ) => {
        const context = await createServiceActionContext();
        const projectWithDefault = project ?? context.projects[0]?.name;

        if (!projectWithDefault) {
          throw new Error('No project specified');
        }

        const { syncProjectAction } =
          await import('@baseplate-dev/project-builder-server/actions/definitions');

        await invokeServiceActionAsCli(
          syncProjectAction,
          {
            project: projectWithDefault,
            packages: options.packages,
          },
          context,
        );
      },
    );
}
