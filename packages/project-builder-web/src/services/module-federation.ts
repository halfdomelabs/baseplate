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
  const wrappedModules = await Promise.all([
    __federation_method_getRemote(pluginKey, `${pluginMetadata.name}/web`),
    __federation_method_getRemote(pluginKey, `${pluginMetadata.name}/common`),
  ]);
  const [webModule, commonModule] = wrappedModules.map(
    (module) =>
      __federation_method_unwrapDefault(module) as
        | PluginPlatformModule
        | PluginPlatformModule[],
  );

  const pluginModules = [
    { key: webModule.name, module: webModule },
    { key: 'common', module: commonModule },
  ];

  return pluginModules;
}
