import type {
  ProjectDefinition,
  ProjectInfo,
  ProjectType,
} from '@baseplate-dev/project-builder-lib';
import type { Logger } from '@baseplate-dev/sync';

import { enhanceErrorWithContext } from '@baseplate-dev/utils';
import { fileExists } from '@baseplate-dev/utils/node';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { generateProjectId } from './project-id.js';

/**
 * Checks if a directory contains a valid Baseplate project.
 * @param baseplateDirectory - The baseplate directory containing project-definition.json.
 * @returns True if the directory contains a valid Baseplate project.
 */
export async function isBaseplateProject(
  baseplateDirectory: string,
): Promise<boolean> {
  const projectDefPath = path.join(
    baseplateDirectory,
    'project-definition.json',
  );
  return await fileExists(projectDefPath);
}

/**
 * Loads project information from a directory containing a Baseplate project.
 * @param outputDirectory - The directory where the project output lives.
 * @param baseplateDirectory - The baseplate directory containing project-definition.json and snapshots.
 * @param type - The project type (user, example, or test).
 * @returns ProjectInfo for the project.
 * @throws Error if the baseplate directory doesn't contain a valid project definition.
 */
export async function loadProjectFromDirectory(
  outputDirectory: string,
  baseplateDirectory: string,
  type: ProjectType,
): Promise<ProjectInfo> {
  const projectDefPath = path.join(
    baseplateDirectory,
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
      id: generateProjectId(outputDirectory),
      name,
      directory: outputDirectory,
      type,
      baseplateDirectory,
    };
  } catch (error) {
    throw enhanceErrorWithContext(
      error,
      `Error loading project definition from ${projectDefPath}`,
    );
  }
}

/**
 * Options for discovering projects across different directory types.
 */
export interface DiscoverProjectsOptions {
  /** User project directories (baseplateDir = dir/baseplate, outputDir = dir) */
  projectDirectories?: string[];
  /** Example project directories (baseplateDir = dir/baseplate, outputDir = dir) */
  exampleDirectories?: string[];
  /** Test project directories (baseplateDir = dir, outputDir = dir/.output) */
  testDirectories?: string[];
}

/**
 * Discovers Baseplate projects from structured directory inputs.
 * @param options - Directories grouped by project type.
 * @param logger - Logger instance for warnings.
 * @returns Array of ProjectInfo for discovered projects.
 */
export async function discoverProjects(
  options: DiscoverProjectsOptions,
  logger: Logger,
): Promise<ProjectInfo[]> {
  const projects: ProjectInfo[] = [];
  const seenNames = new Set<string>();
  const conflicts: string[] = [];

  const directoryGroups: {
    directories: string[];
    type: ProjectType;
    resolveOutputDir: (dir: string) => string;
    resolveBaseplateDir: (dir: string) => string;
  }[] = [
    {
      directories: options.projectDirectories ?? [],
      type: 'user',
      resolveOutputDir: (dir) => dir,
      resolveBaseplateDir: (dir) => path.join(dir, 'baseplate'),
    },
    {
      directories: options.exampleDirectories ?? [],
      type: 'example',
      resolveOutputDir: (dir) => dir,
      resolveBaseplateDir: (dir) => path.join(dir, 'baseplate'),
    },
    {
      directories: options.testDirectories ?? [],
      type: 'test',
      resolveOutputDir: (dir) => path.join(dir, '.output'),
      resolveBaseplateDir: (dir) => dir,
    },
  ];

  for (const group of directoryGroups) {
    for (const directory of group.directories) {
      try {
        const resolvedDir = path.resolve(directory);
        const baseplateDir = group.resolveBaseplateDir(resolvedDir);

        if (await isBaseplateProject(baseplateDir)) {
          const outputDir = group.resolveOutputDir(resolvedDir);
          const project = await loadProjectFromDirectory(
            outputDir,
            baseplateDir,
            group.type,
          );

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
