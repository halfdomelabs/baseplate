import type {
  PluginMetadataWithPaths,
  PluginModule,
  PluginStore,
  ProjectInfo,
  SchemaParserContext,
} from '@baseplate-dev/project-builder-lib';
import type { Logger } from '@baseplate-dev/sync';

import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { SERVER_CORE_MODULES } from '#src/core-modules/index.js';

import { discoverPlugins } from './plugin-discovery.js';

export async function createNodePluginStore(
  plugins: PluginMetadataWithPaths[],
): Promise<PluginStore> {
  const pluginsWithModules = await Promise.all(
    plugins.map(async (plugin) => ({
      metadata: plugin,
      modules: await Promise.all(
        plugin.nodeModulePaths.map(async (modulePath) => {
          const mod = (await import(pathToFileURL(modulePath).href)) as
            | { default: PluginModule }
            | PluginModule;
          const unwrappedModule = 'default' in mod ? mod.default : mod;

          return {
            directory: path.relative(plugin.pluginDirectory, modulePath),
            module: unwrappedModule,
          };
        }),
      ),
    })),
  );
  return {
    availablePlugins: pluginsWithModules,
    coreModules: SERVER_CORE_MODULES,
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
  project: ProjectInfo,
  logger: Logger,
  builtinPlugins: PluginMetadataWithPaths[],
  cliVersion: string,
): Promise<SchemaParserContext> {
  return {
    project,
    pluginStore: await createNodePluginStoreFromDirectory(
      project.directory,
      logger,
      builtinPlugins,
    ),
    cliVersion,
  };
}
