import {
  PluginMetadataWithPaths,
  SchemaParserContext,
  webConfigSpec,
} from '@halfdomelabs/project-builder-lib';
import {
  adminCrudInputWebSpec,
  modelTransformerWebSpec,
} from '@halfdomelabs/project-builder-lib/web';

import { loadPluginModule } from './module-federation';

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
      ],
    },
  };
}
