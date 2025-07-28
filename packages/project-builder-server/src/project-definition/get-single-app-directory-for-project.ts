import type { ProjectDefinition } from '@baseplate-dev/project-builder-lib';

import { AppUtils } from '@baseplate-dev/project-builder-lib';
import path from 'node:path';

/**
 * Given a project directory, get the app directory for that project
 *
 * @param projectDirectory The absolute path to the project directory
 * @param app The name of the app which will be matched
 *
 * @throws Error if there are more than one apps matching the name (or none)
 */
export function getSingleAppDirectoryForProject(
  projectDirectory: string,
  projectDefinition: ProjectDefinition,
  app: string,
): string {
  const matchedApps = projectDefinition.apps.filter((a) =>
    a.name.includes(app),
  );

  if (matchedApps.length === 0) {
    throw new Error(`Unable to find app ${app} in project definition`);
  }

  if (matchedApps.length > 1) {
    throw new Error(
      `Found multiple apps matching ${app}: ${matchedApps.map((a) => a.name).join(', ')}`,
    );
  }

  return path.join(projectDirectory, AppUtils.getAppDirectory(matchedApps[0]));
}
