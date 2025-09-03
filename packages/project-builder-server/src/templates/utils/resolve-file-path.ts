import path from 'node:path';

import type { ProjectInfo } from '../../api/projects.js';

interface ResolvedFilePath {
  /** The absolute file path */
  absolutePath: string;
  /** The relative path from the project directory */
  projectRelativePath: string;
  /** The project that contains this file */
  project: ProjectInfo;
}

/**
 * Resolves a file path (absolute or relative) to project and package information
 */
export function resolveFilePath(
  filePath: string,
  projects: ProjectInfo[],
  project?: string,
): ResolvedFilePath {
  if (path.isAbsolute(filePath)) {
    // Handle absolute paths - find which project contains this path
    return resolveAbsolutePath(filePath, projects);
  }

  // Handle relative paths - require project parameter
  if (!project) {
    throw new Error('Project parameter is required when filePath is relative');
  }

  return resolveRelativePath(filePath, projects, project);
}

/**
 * Resolve an absolute file path to project and package info
 */
function resolveAbsolutePath(
  absolutePath: string,
  projects: ProjectInfo[],
): ResolvedFilePath {
  // Find the project that contains this path
  const matchingProject = projects.find((proj) =>
    absolutePath.startsWith(`${proj.directory}${path.sep}`),
  );

  if (!matchingProject) {
    const availableProjects = projects.map((p) => p.directory).join(', ');
    throw new Error(
      `File path "${absolutePath}" is not within any available project. Available projects: ${availableProjects}`,
    );
  }

  return {
    absolutePath,
    projectRelativePath: path.relative(matchingProject.directory, absolutePath),
    project: matchingProject,
  };
}

/**
 * Resolve a relative file path using the specified project
 */
function resolveRelativePath(
  relativePath: string,
  projects: ProjectInfo[],
  projectNameOrId: string,
): ResolvedFilePath {
  // Find the specified project
  const matchingProject = projects.find(
    (proj) => proj.name === projectNameOrId || proj.id === projectNameOrId,
  );

  if (!matchingProject) {
    const availableProjects = projects.map((p) => p.name).join(', ');
    throw new Error(
      `Project "${projectNameOrId}" not found. Available projects: ${availableProjects}`,
    );
  }

  return {
    absolutePath: path.join(matchingProject.directory, relativePath),
    projectRelativePath: relativePath,
    project: matchingProject,
  };
}
