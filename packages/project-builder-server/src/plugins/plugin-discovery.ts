import {
  PluginConfigWithModule,
  pluginConfigSchema,
} from '@halfdomelabs/project-builder-lib';
import { Logger } from '@halfdomelabs/sync';
import fs from 'fs-extra';
import { createRequire } from 'node:module';
import path from 'node:path';
import { packageUp } from 'package-up';
import { z } from 'zod';

import { notEmpty } from '@src/utils/array.js';
import { InitializeServerError, formatError } from '@src/utils/errors.js';

const pluginsJsonSchema = z.object({
  directories: z.array(z.string()),
});

type PluginJson = z.infer<typeof pluginsJsonSchema>;

async function loadPluginJson(
  requireResolvePath: string,
  logger: Logger,
): Promise<{ config: PluginJson; rootDirectory: string } | null> {
  const packageJsonPath = await packageUp({ cwd: requireResolvePath });
  const packagePath = packageJsonPath && path.dirname(packageJsonPath);
  if (!packagePath) {
    logger.warn(
      `Package ${packagePath} does not have a valid package.json file. Ignoring...`,
    );
    return null;
  }

  const pluginsJsonPath = path.join(packagePath, 'plugins.json');

  if (!(await fs.pathExists(pluginsJsonPath))) {
    logger.warn(
      `Package ${packagePath} does not have a valid plugins.json file. Ignoring...`,
    );
    return null;
  }
  const config = await fs
    .readJson(pluginsJsonPath)
    .then((data) => pluginsJsonSchema.parse(data))
    .catch(() => {
      logger.warn(
        `Could not read the plugins.json file for the package ${packagePath}. Ignoring...`,
      );
      return null;
    });

  if (!config) {
    return null;
  }

  return { config, rootDirectory: packagePath };
}

export async function loadPluginFromDirectory(
  packageName: string,
  pluginDirectory: string,
  logger: Logger,
): Promise<PluginConfigWithModule | null> {
  try {
    const pluginConfig = (await import(
      path.join(pluginDirectory, 'index.js')
    )) as unknown;

    if (typeof pluginConfig !== 'object' || pluginConfig === null) {
      logger.warn(
        `Plugin at ${pluginDirectory} does not export a valid configuration object. Ignoring...`,
      );
      return null;
    }

    if (!('default' in pluginConfig)) {
      logger.warn(
        `Plugin at ${pluginDirectory} does not export a default configuration object. Ignoring...`,
      );
      return null;
    }

    const parsedConfig = pluginConfigSchema.parse(pluginConfig.default);

    return {
      ...parsedConfig,
      // URL safe ID
      id: `${packageName
        .replace(/^@/, '')
        .replace(/[^a-z0-9/]+/g, '-')
        .replace(/\//g, '_')}_${parsedConfig.name.replace(/[^a-z0-9]+/g, '-')}`,
      packageName,
      pluginDirectory,
    };
  } catch (err) {
    logger.warn(
      `Unable to read plugin configuration at ${pluginDirectory}: ${formatError(
        err,
      )}. Ignoring...`,
    );
    return null;
  }
}

/**
 * Finds the available plugins in the project.
 */
export async function discoverPlugins(
  projectDirectory: string,
  logger: Logger,
): Promise<PluginConfigWithModule[]> {
  const packageJsonPath = await packageUp({ cwd: projectDirectory });

  if (!packageJsonPath) {
    throw new InitializeServerError(
      'Could not find root package.json file for the Baseplate project',
      'Make sure the project.json file is inside a valid Node package with @halfdomelabs/project-builder-cli.',
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

  // Load all valid plugins and their configurations
  const require = createRequire(projectDirectory);
  return (
    await Promise.all(
      pluginPackageNames.map(async (packageName) => {
        const packagePath = path.dirname(
          require.resolve(packageName, {
            paths: [projectDirectory],
          }),
        );

        // Look for plugins.json file
        const pluginJsonResult = await loadPluginJson(packagePath, logger);

        if (!pluginJsonResult) {
          return null;
        }

        const { config, rootDirectory } = pluginJsonResult;

        // Load the plugins
        return Promise.all(
          config.directories.map(async (directory) =>
            loadPluginFromDirectory(
              packageName,
              path.join(rootDirectory, directory),
              logger,
            ),
          ),
        );
      }),
    )
  )
    .flat()
    .filter(notEmpty);
}
