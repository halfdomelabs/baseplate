import {
  PluginStore,
  PluginMetadataWithPaths,
  SchemaParserContext,
} from '@halfdomelabs/project-builder-lib';
import { Logger } from '@halfdomelabs/sync';
import path from 'node:path';
import { PluginPlatformModule } from 'node_modules/@halfdomelabs/project-builder-lib/dist/plugins/imports/types.js';

import { discoverPlugins } from './plugin-discovery.js';

export async function createNodePluginStore(
  plugins: PluginMetadataWithPaths[],
): Promise<PluginStore> {
  const pluginsWithModules = await Promise.all(
    plugins.map(async (plugin) => {
      return {
        metadata: plugin,
        modules: [
          {
            key: 'node',
            module: (await import(
              path.join(plugin.pluginDirectory, 'node')
            )) as PluginPlatformModule,
          },
          {
            key: 'common',
            module: (await import(
              path.join(plugin.pluginDirectory, 'common')
            )) as PluginPlatformModule,
          },
        ],
      };
    }),
  );
  return {
    availablePlugins: pluginsWithModules,
  };
}

export async function createNodePluginStoreFromDirectory(
  projectDirectory: string,
  logger: Logger,
  builtinPlugins: PluginMetadataWithPaths[],
): Promise<PluginStore> {
  const plugins = await discoverPlugins(projectDirectory, logger);
  const allPlugins = [
    ...plugins,
    ...builtinPlugins.filter(
      (p) => !plugins.some((p2) => p2.packageName === p.packageName),
    ),
  ];
  return createNodePluginStore(allPlugins);
}

export async function createNodeSchemaParserContext(
  projectDirectory: string,
  logger: Logger,
  builtinPlugins: PluginMetadataWithPaths[],
): Promise<SchemaParserContext> {
  return {
    pluginStore: await createNodePluginStoreFromDirectory(
      projectDirectory,
      logger,
      builtinPlugins,
    ),
  };
}
