import type { ProjectInfo } from '@baseplate-dev/project-builder-lib';

/**
 * Get a project by name or ID.
 * @param projects - The list of projects to search through.
 * @param projectNameOrId - The name or ID of the project to find.
 * @returns The project if found, otherwise throws an error.
 */
export function getProjectByNameOrId(
  projects: ProjectInfo[],
  projectNameOrId: string,
): ProjectInfo {
  const project = projects.find(
    (project) =>
      project.name === projectNameOrId ||
      project.id === projectNameOrId ||
      project.directory === projectNameOrId,
  );

  if (!project) {
    throw new Error(
      `Project "${projectNameOrId}" not found. Available projects: ${projects.map((p) => p.name).join(', ')}`,
    );
  }

  return project;
}
