import type { Command } from 'commander';

import {
  diffProjectAction,
  invokeServiceActionAsCli,
} from '@baseplate-dev/project-builder-server/actions';

import { createServiceActionContext } from '#src/utils/create-service-action-context.js';
import { resolveProject } from '#src/utils/list-projects.js';

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
    .option('--package <packages...>', 'Filter by specific package names')
    .option('--include <patterns...>', 'Filter files by glob patterns')
    .action(
      async (
        project: string | undefined,
        options: {
          compact?: boolean;
          packages?: string[];
          include?: string[];
        },
      ) => {
        const resolvedProject = await resolveProject(project);
        const context = await createServiceActionContext(resolvedProject);

        await invokeServiceActionAsCli(
          diffProjectAction,
          {
            project: resolvedProject.name,
            ...options,
          },
          context,
        );
      },
    );
}
