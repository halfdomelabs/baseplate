import { isExampleProject } from '@baseplate-dev/project-builder-server/actions';
import { readJsonWithSchema } from '@baseplate-dev/utils/node';
import path from 'node:path';
import z from 'zod';

import { findExamplesDirectories } from './find-examples-directories.js';
import { expandPathWithTilde } from './path.js';

/**
 * Information about a discovered project
 */
export interface DiscoveredProjectInfo {
  /** Project name from package.json */
  name: string;
  /** Absolute path to the project directory */
  path: string;
  /** Whether this project is an internal example project */
  isInternalExample: boolean;
}

/**
 * Options for resolving projects
 */
interface ResolveProjectsOptions {
  /** Whether to include example projects (from INCLUDE_EXAMPLES env) */
  includeExamples?: boolean;
  /** Additional directories to include (from PROJECT_DIRECTORIES env or arguments) */
  directories?: string[];
  /** Whether to default to current working directory if no projects specified */
  defaultToCwd?: boolean;
}

/**
 * Resolves all available projects based on the provided options.
 *
 * @param options - Configuration for project resolution
 * @returns Map of project name to DiscoveredProjectInfo
 * @throws Error if duplicate project names are found or if project loading fails
 */
export async function resolveProjects(
  options: ResolveProjectsOptions = {},
): Promise<Map<string, DiscoveredProjectInfo>> {
  const {
    includeExamples = process.env.INCLUDE_EXAMPLES === 'true',
    directories = [],
    defaultToCwd = false,
  } = options;

  const allDirectories = new Set<string>();

  // Add directories from PROJECT_DIRECTORIES env var
  const envDirectories = process.env.PROJECT_DIRECTORIES?.split(',') ?? [];
  for (const dir of envDirectories) {
    if (dir.trim()) {
      allDirectories.add(expandPathWithTilde(dir.trim()));
    }
  }

  // Add explicitly provided directories
  for (const dir of directories) {
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

  const projectMap = new Map<string, DiscoveredProjectInfo>();
  const nameConflicts: string[] = [];

  // Load project info for each directory
  for (const directory of allDirectories) {
    try {
      const projectInfo = await loadProjectInfo(directory);

      // Check for name conflicts
      if (projectMap.has(projectInfo.name)) {
        nameConflicts.push(projectInfo.name);
      } else {
        projectMap.set(projectInfo.name, projectInfo);
      }
    } catch (error) {
      console.warn(
        `Warning: Could not load project from ${directory}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  // Handle name conflicts
  if (nameConflicts.length > 0) {
    throw new Error(
      `Duplicate project names found: ${nameConflicts.join(', ')}. ` +
        'Each project must have a unique name in its package.json.',
    );
  }

  return projectMap;
}

/**
 * Resolves a single project by name or path.
 *
 * @param nameOrPath - Project name or directory path
 * @returns ProjectInfo for the resolved project
 * @throws Error if project cannot be resolved or loaded
 */
export async function resolveProject(
  nameOrPath: string,
): Promise<DiscoveredProjectInfo> {
  // If it looks like a path (contains separators), treat as path
  if (nameOrPath.includes('/') || nameOrPath.includes('\\')) {
    const resolvedPath = expandPathWithTilde(nameOrPath);
    return await loadProjectInfo(resolvedPath);
  }

  // Otherwise, try to resolve by name
  const projectMap = await resolveProjects({
    includeExamples: process.env.INCLUDE_EXAMPLES === 'true',
    defaultToCwd: false,
  });

  const projectInfo = projectMap.get(nameOrPath);
  if (!projectInfo) {
    const availableProjects = [...projectMap.keys()].toSorted();
    throw new Error(
      `Project '${nameOrPath}' not found. Available projects: ${availableProjects.join(', ')}\n` +
        'You can also specify a directory path directly.',
    );
  }

  return projectInfo;
}

/**
 * Loads project information from a directory.
 *
 * @param directory - Absolute path to the project directory
 * @returns ProjectInfo for the project
 * @throws Error if directory doesn't exist or package.json is invalid
 */
async function loadProjectInfo(
  directory: string,
): Promise<DiscoveredProjectInfo> {
  const definitionPath = path.join(
    directory,
    'baseplate',
    'project-definition.json',
  );

  try {
    const definition = await readJsonWithSchema(
      definitionPath,
      z.object({
        settings: z.object({
          general: z.object({
            name: z.string(),
          }),
        }),
      }),
    );

    const { name } = definition.settings.general;

    if (!name) {
      throw new Error(
        'Project definition must have a valid name in settings.general.name',
      );
    }

    const isInternalExample = await isExampleProject(directory);

    return {
      name,
      path: directory,
      isInternalExample,
    };
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      throw new Error(`No package.json found in ${directory}`);
    }
    throw error;
  }
}

/**
 * Gets project directories from resolved projects.
 *
 * @param projectMap - Map of resolved projects
 * @returns Array of absolute directory paths
 */
export function getProjectDirectories(
  projectMap: Map<string, DiscoveredProjectInfo>,
): string[] {
  return [...projectMap.values()].map((project) => project.path);
}

/**
 * Gets project names from resolved projects.
 *
 * @param projectMap - Map of resolved projects
 * @returns Array of project names
 */
export function getProjectNames(
  projectMap: Map<string, DiscoveredProjectInfo>,
): string[] {
  return [...projectMap.keys()].toSorted();
}
