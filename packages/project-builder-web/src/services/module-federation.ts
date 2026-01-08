import type {
  PluginMetadataWithPaths,
  PluginModule,
  PluginModuleWithDirectory,
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
): Promise<PluginModuleWithDirectory[]> {
  const pluginKey = `${projectId}/${pluginMetadata.key}`;
  // use random entry to bust cache
  const remoteEntry = `/api/plugins/${projectId}/${pluginMetadata.key}/web/assets/remoteEntry.js?rnd=${randomSeed}`;

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
    (module) => __federation_method_unwrapDefault(module) as PluginModule,
  );

  const pluginModules = modules.map((module, index) => ({
    directory: pluginMetadata.webModulePaths[index],
    module,
  }));

  return pluginModules;
}
