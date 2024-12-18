import type {
  PluginMetadataWithPaths,
  PluginStore,
  SchemaParserContext,
} from '@halfdomelabs/project-builder-lib';
import type { Logger } from '@halfdomelabs/sync';
import type { PluginPlatformModule } from 'node_modules/@halfdomelabs/project-builder-lib/dist/plugins/imports/types.js';

import {
  adminCrudInputCompilerSpec,
  appCompilerSpec,
  modelTransformerCompilerSpec,
} from '@halfdomelabs/project-builder-lib';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { discoverPlugins } from './plugin-discovery.js';

const NODE_SPEC_IMPLEMENTATIONS = [
  modelTransformerCompilerSpec,
  adminCrudInputCompilerSpec,
  appCompilerSpec,
];

export async function createNodePluginStore(
  plugins: PluginMetadataWithPaths[],
): Promise<PluginStore> {
  const pluginsWithModules = await Promise.all(
    plugins.map(async (plugin) => ({
      metadata: plugin,
      modules: await Promise.all(
        plugin.nodeModulePaths.map(async (modulePath) => {
          const mod = (await import(pathToFileURL(modulePath).href)) as
            | { default: PluginPlatformModule }
            | PluginPlatformModule;
          const unwrappedModule = 'default' in mod ? mod.default : mod;

          return {
            key: path.relative(plugin.pluginDirectory, modulePath),
            module: unwrappedModule,
          };
        }),
      ),
    })),
  );
  return {
    availablePlugins: pluginsWithModules,
    builtinSpecImplementations: NODE_SPEC_IMPLEMENTATIONS,
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
