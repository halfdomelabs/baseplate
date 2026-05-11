import type {
  PluginMetadataWithPaths,
  PluginModule,
  PluginModuleWithDirectory,
} from '@baseplate-dev/project-builder-lib';

import {
  loadRemote,
  registerRemotes,
} from '@module-federation/enhanced/runtime';

let randomSeed = Math.random();
const registeredEntries = new Map<string, string>();

/**
 * Reset the seed used to load plugin modules. This is useful during development
 * if plugin assets have changed.
 */
export function resetPluginModuleSeed(): void {
  randomSeed = Math.random();
  registeredEntries.clear();
}

/**
 * Sanitize a plugin key for use as a Module Federation remote name.
 *
 * The runtime uses `${remoteName}/${exposeKey}` to look up modules, so a slash
 * inside the remote name confuses lookup. We use double-underscores instead.
 */
function getRemoteName(projectId: string, pluginKey: string): string {
  return `${projectId}__${pluginKey}`.replaceAll(/[^a-zA-Z0-9_]/g, '_');
}

export async function loadPluginModule(
  projectId: string,
  pluginMetadata: PluginMetadataWithPaths,
): Promise<PluginModuleWithDirectory[]> {
  const remoteName = getRemoteName(projectId, pluginMetadata.key);
  // use random seed to bust cache
  const remoteEntry = `/api/plugins/${projectId}/${pluginMetadata.key}/web/remoteEntry.js?rnd=${randomSeed}`;

  if (registeredEntries.get(remoteName) !== remoteEntry) {
    registerRemotes(
      [{ name: remoteName, entry: remoteEntry, type: 'module' }],
      { force: true },
    );
    registeredEntries.set(remoteName, remoteEntry);
  }

  const wrappedModules = await Promise.all(
    pluginMetadata.webModulePaths.map((path) =>
      loadRemote<{ default?: PluginModule } | PluginModule>(
        `${remoteName}/${path}`,
      ),
    ),
  );

  return wrappedModules.map((mod, index) => {
    const unwrapped = ((mod as { default?: PluginModule } | null)?.default ??
      mod) as PluginModule;
    return {
      directory: pluginMetadata.webModulePaths[index],
      module: unwrapped,
    };
  });
}
