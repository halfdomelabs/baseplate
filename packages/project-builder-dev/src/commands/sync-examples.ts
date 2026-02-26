import type { Command } from 'commander';

import {
  invokeServiceActionAsCli,
  syncAllProjectsAction,
} from '@baseplate-dev/project-builder-server/actions';

import { createServiceActionContext } from '#src/utils/create-service-action-context.js';
import { getExampleProjects } from '#src/utils/list-projects.js';

/**
 * Adds a sync-examples command to the program.
 * @param program - The program to add the command to.
 */
export function addSyncExamplesCommand(program: Command): void {
  program
    .command('sync-examples')
    .description('Syncs all example projects using the baseplate sync engine')
    .option(
      '--overwrite',
      'Force overwrite existing files and apply snapshots automatically',
    )
    .option('--skip-commands', 'Skip running commands during sync')
    .action(
      async (options: { overwrite?: boolean; skipCommands?: boolean }) => {
        // Get all example projects
        const exampleProjects = await getExampleProjects();

        if (exampleProjects.length === 0) {
          console.info('No example projects found to sync.');
          return;
        }

        console.info(
          `Found ${exampleProjects.length} example projects to sync:`,
        );
        for (const project of exampleProjects) {
          console.info(`  - ${project.name}`);
        }

        // Create context with example projects only
        const baseContext = await createServiceActionContext();
        const context = {
          ...baseContext,
          projects: exampleProjects,
        };

        await invokeServiceActionAsCli(
          syncAllProjectsAction,
          {
            overwrite: options.overwrite,
            skipCommands: options.skipCommands,
          },
          context,
        );
      },
    );
}
