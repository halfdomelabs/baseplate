import type { Command } from 'commander';

import type { DiscoveredProjectInfo } from '../utils/project-resolver.js';

import { resolveProjects } from '../utils/project-resolver.js';

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
    const projectMap = await resolveProjects({
      defaultToCwd: true,
    });

    if (projectMap.size === 0) {
      console.info('No projects found.');
      console.info('Try setting the PROJECT_DIRECTORIES environment variable.');
      return;
    }

    if (options.json) {
      const projects = [...projectMap.values()].map((project) => ({
        name: project.name,
        path: project.path,
        isInternalExample: project.isInternalExample,
      }));

      console.info(JSON.stringify(projects, null, 2));
    } else {
      console.info(`Found ${projectMap.size} project(s):\n`);

      // Group projects by type
      const examples: DiscoveredProjectInfo[] = [];
      const regular: DiscoveredProjectInfo[] = [];

      for (const project of projectMap.values()) {
        if (project.isInternalExample) {
          examples.push(project);
        } else {
          regular.push(project);
        }
      }

      // Display regular projects first
      if (regular.length > 0) {
        console.info('📦 Projects:');
        for (const project of regular) {
          console.info(`   ${project.name}`);
          console.info(`     Path: ${project.path}`);
          console.info();
        }
      }

      // Display examples
      if (examples.length > 0) {
        console.info('📚 Examples:');
        for (const project of examples) {
          console.info(`   ${project.name}`);
          console.info(`     Path: ${project.path}`);
          console.info();
        }
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
