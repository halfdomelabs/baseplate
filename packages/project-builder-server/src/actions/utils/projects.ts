import type { ServiceActionProject } from '../types.js';

/**
 * Get a project by name or ID.
 * @param projects - The list of projects to search through.
 * @param projectNameOrId - The name or ID of the project to find.
 * @returns The project if found, otherwise throws an error.
 */
export function getProjectByNameOrId(
  projects: ServiceActionProject[],
  projectNameOrId: string,
): ServiceActionProject {
  const project = projects.find(
    (project) =>
      project.name === projectNameOrId || project.id === projectNameOrId,
  );

  if (!project) {
    throw new Error(
      `Project "${projectNameOrId}" not found. Available projects: ${projects.map((p) => p.name).join(', ')}`,
    );
  }

  return project;
}
