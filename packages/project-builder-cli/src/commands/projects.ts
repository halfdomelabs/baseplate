import type { Command } from 'commander';

import { listProjects } from '#src/utils/list-projects.js';

interface ListProjectsOptions {
  json?: boolean;
}

/**
 * Adds project management commands to the program.
 * @param program - The program to add the commands to.
 */
export function addProjectsCommand(program: Command): void {
  const projectsCommand = program
    .command('projects')
    .description('Manage and discover projects');

  // Projects list subcommand
  projectsCommand
    .command('list')
    .description('List all available projects')
    .option('--json', 'Output in JSON format', false)
    .action(async (options: ListProjectsOptions) => {
      await handleListProjects(options);
    });
}

async function handleListProjects(options: ListProjectsOptions): Promise<void> {
  try {
    const projects = await listProjects({});

    if (projects.length === 0) {
      console.info('No projects found.');
      console.info('Try setting the PROJECT_DIRECTORIES environment variable.');
      return;
    }

    if (options.json) {
      const output = projects.map((project) => ({
        name: project.name,
        directory: project.directory,
      }));

      console.info(JSON.stringify(output, null, 2));
    } else {
      console.info(`Found ${projects.length} project(s):\n`);

      for (const project of projects) {
        console.info(`   ${project.name}`);
        console.info(`     Path: ${project.directory}`);
        console.info();
      }

      console.info('Usage examples:');
      console.info('  pnpm baseplate serve <project-name>');
      console.info('  pnpm baseplate diff <project-name>');
      console.info('  pnpm baseplate templates extract <project-name> <app>');
      console.info();
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Failed to list projects: ${errorMessage}`);
    throw error;
  }
}
