import type { Command } from 'commander';

import {
  initProjectAction,
  invokeServiceActionAsCli,
} from '@baseplate-dev/project-builder-server/actions';
import path from 'node:path';

import { createServiceActionContext } from '#src/utils/create-service-action-context.js';
import { loadDevConfig } from '#src/utils/dev-config.js';

async function resolveProjectDir(
  name: string,
  type: 'example' | 'test',
): Promise<string> {
  const config = await loadDevConfig();
  const directory =
    type === 'test' ? config.testProjectsDirectory : config.examplesDirectory;

  if (!directory) {
    throw new Error(
      `No ${type} directory configured. Set "${type === 'test' ? 'testProjectsDirectory' : 'examplesDirectory'}" in baseplate.config.json.`,
    );
  }

  return path.join(directory, name);
}

/**
 * Adds the init command to the program.
 */
export function addInitCommand(program: Command): void {
  program
    .command('init <name>')
    .description('Initialize a new example or test project')
    .option('--type <type>', 'Project type: "example" or "test"', 'test')
    .action(async (name: string, opts: { type: string }) => {
      const { type } = opts;
      if (type !== 'example' && type !== 'test') {
        throw new Error(
          `Invalid project type "${type}". Must be "example" or "test".`,
        );
      }

      const projectDir = await resolveProjectDir(name, type);
      const context = await createServiceActionContext();
      await invokeServiceActionAsCli(
        initProjectAction,
        { projectDirectory: projectDir, projectName: name, type },
        context,
      );
    });
}
