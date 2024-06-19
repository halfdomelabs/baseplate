import {
  PluginMetadataWithPaths,
  pluginMetadataSchema,
} from '@halfdomelabs/project-builder-lib';
import { Logger } from '@halfdomelabs/sync';
import fs from 'fs-extra';
import { createRequire } from 'node:module';
import path from 'node:path';
import { packageUp } from 'package-up';
import { z } from 'zod';

import { notEmpty } from '@src/utils/array.js';
import { InitializeServerError, formatError } from '@src/utils/errors.js';

const manifestJsonSchema = z.object({
  plugins: z.array(z.string()),
  web_build: z.string(),
});

type ManifestJson = z.infer<typeof manifestJsonSchema>;

async function loadManifestJson(
  requireResolvePath: string,
  logger: Logger,
): Promise<{
  manifest: ManifestJson;
  rootDirectory: string;
} | null> {
  const packageJsonPath = await packageUp({ cwd: requireResolvePath });
  const packagePath = packageJsonPath && path.dirname(packageJsonPath);
  if (!packagePath) {
    logger.warn(
      `Package ${packagePath} does not have a valid package.json file. Ignoring...`,
    );
    return null;
  }

  const manifestJsonPath = path.join(packagePath, 'manifest.json');

  if (!(await fs.pathExists(manifestJsonPath))) {
    logger.warn(
      `Package ${packagePath} does not have a valid manifest.json file. Ignoring...`,
    );
    return null;
  }
  const manifest = await fs
    .readJson(manifestJsonPath)
    .then((data) => manifestJsonSchema.parse(data))
    .catch(() => {
      logger.warn(
        `Could not read the manifest.json file for the package ${packagePath}. Ignoring...`,
      );
      return null;
    });

  if (!manifest) {
    return null;
  }

  return {
    manifest,
    rootDirectory: packagePath,
  };
}

export async function loadPluginFromDirectory(
  packageName: string,
  pluginDirectory: string,
  webBuildDirectory: string,
  logger: Logger,
): Promise<PluginMetadataWithPaths | null> {
  try {
    const pluginMetadata = (await import(
      path.join(pluginDirectory, 'metadata.js')
    )) as unknown;

    if (typeof pluginMetadata !== 'object' || pluginMetadata === null) {
      logger.warn(
        `Plugin at ${pluginDirectory} does not export a valid metadata object. Ignoring...`,
      );
      return null;
    }

    if (!('default' in pluginMetadata)) {
      logger.warn(
        `Plugin at ${pluginDirectory} does not export a default metadata object. Ignoring...`,
      );
      return null;
    }

    const parsedMetadata = pluginMetadataSchema.parse(pluginMetadata.default);

    return {
      ...parsedMetadata,
      // URL safe ID
      id: `${packageName
        .replace(/^@/, '')
        .replace(/[^a-z0-9/]+/g, '-')
        .replace(
          /\//g,
          '_',
        )}_${parsedMetadata.name.replace(/[^a-z0-9]+/g, '-')}`,
      packageName,
      pluginDirectory,
      webBuildDirectory,
    };
  } catch (err) {
    logger.warn(
      `Unable to read plugin metadata at ${pluginDirectory}: ${formatError(
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
): Promise<PluginMetadataWithPaths[]> {
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

        // Look for manifest.json file
        const manifestJsonResult = await loadManifestJson(packagePath, logger);

        if (!manifestJsonResult) {
          return null;
        }

        const { manifest, rootDirectory } = manifestJsonResult;

        // Load the plugins
        return Promise.all(
          manifest.plugins.map(async (directory) =>
            loadPluginFromDirectory(
              packageName,
              path.join(rootDirectory, directory),
              path.join(rootDirectory, manifest.web_build),
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
