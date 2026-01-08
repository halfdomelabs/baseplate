import type {
  PluginMetadataWithPaths,
  ProjectInfo,
  SchemaParserContext,
} from '@baseplate-dev/project-builder-lib';

import { WEB_CORE_MODULES } from '#src/core-modules/index.js';

import { loadPluginModule } from './module-federation.js';

export async function createWebSchemaParserContext(
  project: ProjectInfo,
  cliVersion: string,
  plugins: PluginMetadataWithPaths[],
): Promise<SchemaParserContext> {
  return {
    project,
    cliVersion,
    pluginStore: {
      availablePlugins: await Promise.all(
        plugins.map(async (plugin) => {
          const modules = await loadPluginModule(project.id, plugin);
          return {
            metadata: plugin,
            modules,
          };
        }),
      ),
      coreModules: WEB_CORE_MODULES,
    },
  };
}
