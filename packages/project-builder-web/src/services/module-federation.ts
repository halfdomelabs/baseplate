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

export async function loadPluginModule(
  projectId: string,
  pluginMetadata: PluginMetadataWithPaths,
): Promise<KeyedPluginPlatformModule[]> {
  const pluginKey = `${projectId}/${pluginMetadata.id}`;
  // use random entry to bust cache
  const randomEntry = Math.random();
  const remoteEntry = `/api/plugins/${projectId}/${pluginMetadata.id}/web/assets/remoteEntry.js?rnd=${randomEntry}`;

  __federation_method_setRemote(pluginKey, {
    url: remoteEntry,
    externalType: 'url',
    format: 'esm',
    from: 'vite',
  });

  // load module
  const wrappedModules = await Promise.all(
    pluginMetadata.webModulePaths.map((path) =>
      __federation_method_getRemote(pluginKey, path),
    ),
  );
  const modules = wrappedModules.map(
    (module) =>
      __federation_method_unwrapDefault(module) as PluginPlatformModule,
  );

  const pluginModules = modules.map((module, index) => ({
    key: pluginMetadata.webModulePaths[index],
    module,
  }));

  return pluginModules;
}
