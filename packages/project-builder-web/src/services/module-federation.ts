import type {
  KeyedPluginPlatformModule,
  PluginMetadataWithPaths,
  PluginPlatformModule,
} from '@baseplate-dev/project-builder-lib';

import {
  __federation_method_getRemote,
  __federation_method_setRemote,
  __federation_method_unwrapDefault,
} from 'virtual:__federation__';

let randomSeed = Math.random();

/**
 * Reset the seed used to load plugin modules. This is useful during development
 * if plugin assets have changed.
 */
export function resetPluginModuleSeed(): void {
  randomSeed = Math.random();
}

export async function loadPluginModule(
  projectId: string,
  pluginMetadata: PluginMetadataWithPaths,
): Promise<KeyedPluginPlatformModule[]> {
  const pluginKey = `${projectId}/${pluginMetadata.id}`;
  // use random entry to bust cache
  const remoteEntry = `/api/plugins/${projectId}/${pluginMetadata.id}/web/assets/remoteEntry.js?rnd=${randomSeed}`;

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
