import {
  KeyedPluginPlatformModule,
  PluginMetadataWithPaths,
  PluginPlatformModule,
} from '@halfdomelabs/project-builder-lib';
import {
  __federation_method_setRemote,
  __federation_method_getRemote,
  __federation_method_unwrapDefault,
} from 'virtual:__federation__';

const pluginModuleCache = new Map<string, KeyedPluginPlatformModule[]>();

export async function loadPluginModule(
  projectId: string,
  pluginMetadata: PluginMetadataWithPaths,
): Promise<KeyedPluginPlatformModule[]> {
  const pluginKey = `${projectId}/${pluginMetadata.id}`;
  const remoteEntry = `/api/plugins/${projectId}/${pluginMetadata.id}/web/assets/remoteEntry.js`;

  if (pluginModuleCache.has(pluginKey)) {
    return pluginModuleCache.get(pluginKey)!;
  }

  __federation_method_setRemote(pluginKey, {
    url: remoteEntry,
    externalType: 'url',
    format: 'esm',
    from: 'vite',
  });

  // load module
  const wrappedModules = await Promise.all([
    __federation_method_getRemote(pluginKey, `${pluginMetadata.name}/web`),
    __federation_method_getRemote(pluginKey, `${pluginMetadata.name}/common`),
  ]);
  const [nodeModule, commonModule] = wrappedModules.map(
    (module) =>
      __federation_method_unwrapDefault(module) as PluginPlatformModule,
  );

  const pluginModules = [
    { key: 'node', module: nodeModule },
    { key: 'common', module: commonModule },
  ];

  pluginModuleCache.set(pluginKey, pluginModules);

  return pluginModules;
}
