import type { ServiceActionProject } from '@baseplate-dev/project-builder-server/actions';

import {
  discoverProjects,
  loadProjectFromDirectory,
} from '@baseplate-dev/project-builder-server/actions';
import path from 'node:path';

import { logger } from '#src/services/logger.js';

import { getEnvConfig } from './config.js';
import { findExamplesDirectories } from './find-examples-directories.js';
import { expandPathWithTilde } from './path.js';

const config = getEnvConfig();

async function getSearchDirectories({
  additionalDirectories,
  includeExamples,
  defaultToCwd,
}: {
  additionalDirectories?: string[];
  includeExamples: boolean;
  defaultToCwd: boolean;
}): Promise<string[]> {
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

  // Add example directories if requested
  if (includeExamples) {
    const exampleDirs = await findExamplesDirectories();
    for (const dir of exampleDirs) {
      allDirectories.add(dir);
    }
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
 * - Example directories (if INCLUDE_EXAMPLES is enabled)
 * - Current working directory (as fallback)
 *
 * @param options - Configuration options for project discovery
 * @param options.additionalDirectories - Optional array of additional directory paths to search for projects
 * @returns Promise that resolves to an array of discovered projects
 *
 * @example
 * ```typescript
 * // List all projects from default directories
 * const projects = await listProjects({});
 *
 * // List projects including additional custom directories
 * const projects = await listProjects({
 *   additionalDirectories: ['/path/to/custom/projects', '~/my-projects']
 * });
 * ```
 */
export async function listProjects({
  additionalDirectories,
}: {
  additionalDirectories?: string[];
}): Promise<ServiceActionProject[]> {
  const searchDirectories = await getSearchDirectories({
    additionalDirectories,
    includeExamples: config.INCLUDE_EXAMPLES ?? false,
    defaultToCwd: true,
  });
  return discoverProjects(searchDirectories, logger);
}

/**
 * Resolves a project by name or directory path.
 *
 * This function can resolve projects in two ways:
 * 1. **Path-based resolution**: If the input starts with '.', '/', or '~', it treats the input as a directory path
 * 2. **Name-based resolution**: Otherwise, it searches through all available projects by name or ID
 *
 * @param projectNameOrDirectory - Project name, ID, or directory path to resolve
 * @returns Promise that resolves to the found project
 * @throws {Error} When the project cannot be found
 *
 * @example
 * ```typescript
 * // Resolve by project name
 * const project = await resolveProject('my-project');
 *
 * // Resolve by project ID
 * const project = await resolveProject('proj_123');
 *
 * // Resolve by relative path
 * const project = await resolveProject('./my-project');
 *
 * // Resolve by absolute path
 * const project = await resolveProject('/path/to/project');
 *
 * // Resolve by home directory path
 * const project = await resolveProject('~/projects/my-project');
 * ```
 */
export async function resolveProject(
  projectNameOrDirectory: string | undefined = process.cwd(),
): Promise<ServiceActionProject> {
  if (
    projectNameOrDirectory.startsWith('.') ||
    path.isAbsolute(projectNameOrDirectory) ||
    projectNameOrDirectory.startsWith('~')
  ) {
    const resolvedPath = expandPathWithTilde(projectNameOrDirectory);
    const projectInfo = await loadProjectFromDirectory(resolvedPath);

    return projectInfo;
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
