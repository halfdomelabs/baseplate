import type { Command } from 'commander';

import { invokeServiceActionAsCli } from '@baseplate-dev/project-builder-server/actions';

import { createServiceActionContext } from '#src/utils/create-service-action-context.js';
import { getExampleProjects } from '#src/utils/list-projects.js';

/**
 * Adds a diff-examples command to the program.
 * @param program - The program to add the command to.
 */
export function addDiffExamplesCommand(program: Command): void {
  program
    .command('diff-examples')
    .description(
      'Diffs all example projects against what the sync engine would generate',
    )
    .option('--include <patterns...>', 'Filter files by glob patterns')
    .option(
      '--fail-on-differences',
      'Fail the command if differences are found',
    )
    .action(
      async (options: { include?: string[]; failOnDifferences?: boolean }) => {
        const exampleProjects = await getExampleProjects();

        if (exampleProjects.length === 0) {
          console.info('No example projects found to diff.');
          return;
        }

        const baseContext = await createServiceActionContext();
        const context = {
          ...baseContext,
          projects: exampleProjects,
        };

        // Imported dynamically so the action handlers (and their generator
        // dependencies) stay off the startup path of every CLI command.
        const { diffAllProjectsAction } =
          await import('@baseplate-dev/project-builder-server/actions/definitions');
        const result = await invokeServiceActionAsCli(
          diffAllProjectsAction,
          { include: options.include },
          context,
        );

        if (result.hasDifferences && options.failOnDifferences) {
          throw new Error(
            'Differences found between generated output and one or more example projects',
          );
        }
      },
    );
}
