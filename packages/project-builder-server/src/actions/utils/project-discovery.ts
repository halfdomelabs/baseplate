import type { ProjectDefinition } from '@baseplate-dev/project-builder-lib';
import type { Logger } from '@baseplate-dev/sync';

import { enhanceErrorWithContext } from '@baseplate-dev/utils';
import { fileExists } from '@baseplate-dev/utils/node';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import type { ServiceActionProject } from '../types.js';

import { generateProjectId } from './project-id.js';

/**
 * Checks if a directory contains a valid Baseplate project.
 * @param directory - The directory path to check.
 * @returns True if the directory contains a valid Baseplate project.
 */
export async function isBaseplateProject(directory: string): Promise<boolean> {
  const projectDefPath = path.join(
    directory,
    'baseplate',
    'project-definition.json',
  );
  return await fileExists(projectDefPath);
}

/**
 * Loads project information from a directory containing a Baseplate project.
 * @param directory - The absolute path to the project directory.
 * @returns ServiceActionProject for the project.
 * @throws Error if directory doesn't contain a valid Baseplate project or loading fails.
 */
export async function loadProjectFromDirectory(
  directory: string,
): Promise<ServiceActionProject> {
  const projectDefPath = path.join(
    directory,
    'baseplate',
    'project-definition.json',
  );

  if (!(await fileExists(projectDefPath))) {
    throw new Error(`No project definition found at ${projectDefPath}`);
  }

  try {
    const projectDefContent = await readFile(projectDefPath, 'utf-8');
    const projectDef = JSON.parse(projectDefContent) as ProjectDefinition;

    const { name } = projectDef.settings.general;
    if (!name || typeof name !== 'string') {
      throw new Error(
        'Project definition must have a valid name in settings.general.name',
      );
    }

    return {
      id: generateProjectId(directory),
      name,
      directory,
    };
  } catch (error) {
    throw enhanceErrorWithContext(
      error,
      `Error loading project definition from ${projectDefPath}`,
    );
  }
}

/**
 * Discovers Baseplate projects from a list of directories.
 * @param directories - Array of directory paths to search.
 * @returns Array of ServiceActionProject for discovered projects.
 */
export async function discoverProjects(
  directories: string[],
  logger: Logger,
): Promise<ServiceActionProject[]> {
  const projects: ServiceActionProject[] = [];
  const seenNames = new Set<string>();
  const conflicts: string[] = [];

  for (const directory of directories) {
    try {
      const resolvedDir = path.resolve(directory);

      if (await isBaseplateProject(resolvedDir)) {
        const project = await loadProjectFromDirectory(resolvedDir);

        // Check for name conflicts
        if (seenNames.has(project.name)) {
          conflicts.push(project.name);
        } else {
          seenNames.add(project.name);
          projects.push(project);
        }
      }
    } catch (error) {
      logger.warn(
        `Warning: Could not load project from ${directory}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  // Handle name conflicts
  if (conflicts.length > 0) {
    throw new Error(
      `Duplicate project names found: ${conflicts.join(', ')}. ` +
        'Each project must have a unique name in its project definition.',
    );
  }

  return projects;
}
