import {
  PluginConfigWithModule,
  pluginConfigSchema,
} from '@halfdomelabs/project-builder-lib';
import { Logger } from '@halfdomelabs/sync';
import fs from 'fs-extra';
import { packageUp } from 'package-up';

import { notEmpty } from '@src/utils/array.js';
import { InitializeServerError, formatError } from '@src/utils/errors.js';

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
  const pluginNames = [
    ...Object.keys(packageJson.dependencies ?? {}),
    ...Object.keys(packageJson.devDependencies ?? {}),
  ].filter(
    (name) =>
      name.startsWith('baseplate-plugin-') ||
      name.match(/^@[^/]+\/baseplate-plugin-/),
  );

  // Load all valid plugins and their configurations
  return (
    await Promise.all(
      pluginNames.map(async (pluginName) => {
        const pluginPath = require.resolve(pluginName, {
          paths: [projectDirectory],
        });
        const pluginConfigRaw = (await import(pluginPath)) as unknown;
        try {
          const pluginConfigs = Array.isArray(pluginConfigRaw)
            ? pluginConfigRaw
            : [pluginConfigRaw];
          return pluginConfigs.map((pluginConfig) => ({
            ...pluginConfigSchema.parse(pluginConfig),
            moduleName: pluginName,
          }));
        } catch (err) {
          logger.warn(
            `Unable to read plugin configuration at ${pluginPath}: ${formatError(
              err,
            )}. Ignoring...`,
          );
        }
      }),
    )
  )
    .flat()
    .filter(notEmpty);
}
