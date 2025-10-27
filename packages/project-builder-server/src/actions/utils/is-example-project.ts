import {
  findNearestPackageJson,
  readJsonWithSchema,
} from '@baseplate-dev/utils/node';
import path from 'node:path';
import { z } from 'zod';

/**
 * Checks if a directory is an example project.
 * @param directory - The directory to check if it is an example project.
 * @returns True if the directory is an example project, false otherwise.
 */
export async function isExampleProject(directory: string): Promise<boolean> {
  const parentPackageJson = await findNearestPackageJson({
    cwd: path.dirname(directory),
  });

  if (!parentPackageJson) {
    return false;
  }

  const parentPackageJsonContent = await readJsonWithSchema(
    parentPackageJson,
    z.object({ name: z.string() }),
  ).catch(() => undefined);

  if (!parentPackageJsonContent) {
    return false;
  }

  return parentPackageJsonContent.name === '@baseplate-dev/root';
}
