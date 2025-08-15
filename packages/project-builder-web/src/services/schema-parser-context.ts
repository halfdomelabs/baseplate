import type {
  PluginMetadataWithPaths,
  SchemaParserContext,
} from '@baseplate-dev/project-builder-lib';

import { webConfigSpec } from '@baseplate-dev/project-builder-lib';
import {
  adminCrudActionWebSpec,
  adminCrudInputWebSpec,
  modelTransformerWebSpec,
} from '@baseplate-dev/project-builder-lib/web';

import { loadPluginModule } from './module-federation.js';

export async function createWebSchemaParserContext(
  projectId: string,
  plugins: PluginMetadataWithPaths[],
): Promise<SchemaParserContext> {
  return {
    pluginStore: {
      availablePlugins: await Promise.all(
        plugins.map(async (plugin) => {
          const modules = await loadPluginModule(projectId, plugin);
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
      ],
    },
  };
}
