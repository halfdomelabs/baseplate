import type {
  PluginMetadataWithPaths,
  ProjectInfo,
  SchemaParserContext,
} from '@baseplate-dev/project-builder-lib';

import { webConfigSpec } from '@baseplate-dev/project-builder-lib';
import {
  adminCrudActionWebSpec,
  adminCrudColumnWebSpec,
  adminCrudInputWebSpec,
  modelTransformerWebSpec,
} from '@baseplate-dev/project-builder-lib/web';

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
      builtinSpecImplementations: [
        webConfigSpec,
        modelTransformerWebSpec,
        adminCrudInputWebSpec,
        adminCrudActionWebSpec,
        adminCrudColumnWebSpec,
      ],
    },
  };
}
