import type { ProjectInfo } from '@baseplate-dev/project-builder-lib';

import {
  discoverProjects,
  loadProjectFromDirectory,
} from '@baseplate-dev/project-builder-server/actions';
import { expandPathWithTilde } from '@baseplate-dev/utils/node';
import path from 'node:path';

import { logger } from '#src/services/logger.js';

import { getEnvConfig } from './config.js';

const config = getEnvConfig();

function getSearchDirectories({
  additionalDirectories,
  defaultToCwd,
}: {
  additionalDirectories?: string[];
  defaultToCwd: boolean;
}): string[] {
  const allDirectories = new Set<string>();

  // Add directories from PROJECT_DIRECTORIES env var
  const envDirectories = config.PROJECT_DIRECTORIES?.split(',') ?? [];
  for (const dir of envDirectories) {
    if (dir.trim()) {
      allDirectories.add(expandPathWithTilde(dir.trim()));
    }
  }

  // Add explicitly provided directories
  for (const dir of additionalDirectories ?? []) {
    allDirectories.add(expandPathWithTilde(dir));
  }

  // Default to current working directory if no projects specified
  if (allDirectories.size === 0 && defaultToCwd) {
    allDirectories.add(process.cwd());
  }

  return [...allDirectories];
}

/**
 * Lists all available projects by searching through configured directories.
 *
 * This function searches for projects in:
 * - Directories specified in PROJECT_DIRECTORIES environment variable
 * - Additional directories provided as parameters
 * - Current working directory (as fallback)
 *
 * @param options - Configuration options for project discovery
 * @param options.additionalDirectories - Optional array of additional directory paths to search for projects
 * @returns Promise that resolves to an array of discovered projects
 */
export async function listProjects({
  additionalDirectories,
}: {
  additionalDirectories?: string[];
}): Promise<ProjectInfo[]> {
  const searchDirectories = getSearchDirectories({
    additionalDirectories,
    defaultToCwd: true,
  });
  return discoverProjects({ projectDirectories: searchDirectories }, logger);
}

/**
 * Resolves a project by name or directory path.
 *
 * @param projectNameOrDirectory - Project name, ID, or directory path to resolve
 * @returns Promise that resolves to the found project
 * @throws {Error} When the project cannot be found
 */
export async function resolveProject(
  projectNameOrDirectory: string | undefined = process.cwd(),
): Promise<ProjectInfo> {
  if (
    projectNameOrDirectory.startsWith('.') ||
    path.isAbsolute(projectNameOrDirectory) ||
    projectNameOrDirectory.startsWith('~')
  ) {
    const resolvedPath = expandPathWithTilde(projectNameOrDirectory);
    return loadProjectFromDirectory(
      resolvedPath,
      path.join(resolvedPath, 'baseplate'),
      'user',
    );
  }

  const projects = await listProjects({});
  const project = projects.find(
    (p) => p.name === projectNameOrDirectory || p.id === projectNameOrDirectory,
  );
  if (!project) {
    throw new Error(`Project ${projectNameOrDirectory} not found`);
  }
  return project;
}
