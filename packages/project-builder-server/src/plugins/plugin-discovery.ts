import type { PluginMetadataWithPaths } from '@baseplate-dev/project-builder-lib';
import type { Logger } from '@baseplate-dev/sync';

import { loadPluginsInPackage } from '@baseplate-dev/project-builder-lib/plugin-tools';
import { notEmpty } from '@baseplate-dev/utils';
import {
  dirExists,
  findNearestPackageJson,
  readJsonWithSchema,
} from '@baseplate-dev/utils/node';
import { createRequire } from 'node:module';
import path from 'node:path';
import { z } from 'zod';

import { UserVisibleError } from '#src/utils/errors.js';

/**
 * Finds the available plugins in the project.
 */
export async function discoverPlugins(
  projectDirectory: string,
  logger: Logger,
): Promise<PluginMetadataWithPaths[]> {
  const directoryExists = await dirExists(projectDirectory);
  if (!directoryExists) {
    throw new UserVisibleError(
      `The project directory ${projectDirectory} does not exist.`,
      'Make sure the project directory exists and is accessible.',
    );
  }

  const packageJsonPath = await findNearestPackageJson({
    cwd: projectDirectory,
  });

  if (!packageJsonPath) {
    throw new UserVisibleError(
      `Could not find root package.json file for the Baseplate project at ${projectDirectory}.`,
      'Make sure the project-definition.json file is inside a valid Node package with @baseplate-dev/project-builder-cli.',
    );
  }

  // Load the package.json file
  const packageJson = await readJsonWithSchema(
    packageJsonPath,
    z.object({
      dependencies: z.record(z.string(), z.string()).optional(),
      devDependencies: z.record(z.string(), z.string()).optional(),
    }),
  ).catch(() => {
    throw new UserVisibleError(
      `Could not read the root package.json file for the Baseplate project at ${packageJsonPath}.`,
      'Make sure the package.json file is a valid JSON file.',
    );
  });

  // Look for plugins that start with baseplate-plugin- or @scope/baseplate-plugin- or @baseplate-dev/plugin-
  const pluginPackageNames = [
    ...Object.keys(packageJson.dependencies ?? {}),
    ...Object.keys(packageJson.devDependencies ?? {}),
  ].filter(
    (name) =>
      name.startsWith('baseplate-plugin-') ||
      !!/^@[^/]+\/baseplate-plugin-/.test(name) ||
      name.startsWith('@baseplate-dev/plugin-'),
  );

  // Load all valid plugins and their metadata
  const require = createRequire(projectDirectory);
  const loadedPlugins = await Promise.all(
    pluginPackageNames.map(async (packageName) => {
      const packagePath = path.dirname(
        require.resolve(packageName, {
          paths: [projectDirectory],
        }),
      );

      const pluginPackageJsonPath = await findNearestPackageJson({
        cwd: packagePath,
        stopAtNodeModules: true,
      });

      if (!pluginPackageJsonPath) {
        logger.error(
          `Could not find package.json file for the plugin ${packageName}.`,
        );
        return;
      }

      return loadPluginsInPackage(
        path.dirname(pluginPackageJsonPath),
        packageName,
      );
    }),
  );
  return loadedPlugins.flat().filter(notEmpty);
}
