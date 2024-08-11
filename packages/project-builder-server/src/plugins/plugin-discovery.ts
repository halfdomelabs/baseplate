import { PluginMetadataWithPaths } from '@halfdomelabs/project-builder-lib';
import { loadPluginsInPackage } from '@halfdomelabs/project-builder-lib/plugin-tools';
import { Logger } from '@halfdomelabs/sync';
import fs from 'fs-extra';
import { createRequire } from 'node:module';
import path from 'node:path';
import { packageUp } from 'package-up';

import { notEmpty } from '@src/utils/array.js';
import { InitializeServerError } from '@src/utils/errors.js';

/**
 * Finds the available plugins in the project.
 */
export async function discoverPlugins(
  projectDirectory: string,
  logger: Logger,
): Promise<PluginMetadataWithPaths[]> {
  const packageJsonPath = await packageUp({ cwd: projectDirectory });

  if (!packageJsonPath) {
    throw new InitializeServerError(
      'Could not find root package.json file for the Baseplate project',
      'Make sure the project-definition.json file is inside a valid Node package with @halfdomelabs/project-builder-cli.',
    );
  }

  // Load the package.json file
  const packageJson = (await fs.readJson(packageJsonPath).catch(() => {
    throw new InitializeServerError(
      `Could not read the root package.json file for the Baseplate project at ${packageJsonPath}.`,
      'Make sure the package.json file is a valid JSON file.',
    );
  })) as {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };

  // Look for plugins that start with baseplate-plugin- or @scope/baseplate-plugin-
  const pluginPackageNames = [
    ...Object.keys(packageJson.dependencies ?? {}),
    ...Object.keys(packageJson.devDependencies ?? {}),
  ].filter(
    (name) =>
      name.startsWith('baseplate-plugin-') ||
      name.match(/^@[^/]+\/baseplate-plugin-/),
  );

  // Load all valid plugins and their metadata
  const require = createRequire(projectDirectory);
  return (
    await Promise.all(
      pluginPackageNames.map(async (packageName) => {
        const packagePath = path.dirname(
          require.resolve(packageName, {
            paths: [projectDirectory],
          }),
        );

        const pluginPackageJsonPath = await packageUp({ cwd: packagePath });

        if (!pluginPackageJsonPath) {
          logger.error(
            `Could not find package.json file for the plugin ${packageName}.`,
          );
          return undefined;
        }

        return loadPluginsInPackage(
          path.dirname(pluginPackageJsonPath),
          packageName,
        );
      }),
    )
  )
    .flat()
    .filter(notEmpty);
}
