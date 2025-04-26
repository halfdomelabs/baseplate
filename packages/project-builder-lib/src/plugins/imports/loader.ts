import { toposortOrdered } from '@halfdomelabs/utils';
import { keyBy, mapValues } from 'es-toolkit';

import { stripUndefinedValues } from '@src/utils/strip.js';

import type { PluginSpecImplementation } from '../spec/types.js';
import type { KeyedPluginPlatformModule } from './types.js';

import { PluginImplementationStore } from '../schema/store.js';

export interface PluginWithPlatformModules {
  id: string;
  name: string;
  pluginModules: KeyedPluginPlatformModule[];
}

interface KeyedPlatformModuleWithPlugin extends KeyedPluginPlatformModule {
  id: string;
  name: string;
  pluginId: string;
  pluginName: string;
}

export function extractPlatformModulesFromPlugins(
  plugins: PluginWithPlatformModules[],
): KeyedPlatformModuleWithPlugin[] {
  return plugins.flatMap((plugin) =>
    plugin.pluginModules.map((m) => ({
      ...m,
      id: `${plugin.id}/${m.key}`,
      name: `${plugin.name}/${m.key}`,
      pluginId: plugin.id,
      pluginName: plugin.name,
    })),
  );
}

export function getOrderedPluginModuleInitializationSteps(
  pluginModules: KeyedPlatformModuleWithPlugin[],
  initialSpecImplementations: Record<string, PluginSpecImplementation>,
): string[] {
  const pluginModulesById = keyBy(pluginModules, (p) => p.id);

  // create export map of plugin ID to export spec name
  const pluginModuleIdByExport: Record<string, string> = mapValues(
    initialSpecImplementations,
    () => 'built-in',
  );
  for (const { name, module, id } of pluginModules) {
    for (const m of Object.values(module.exports ?? {})) {
      const exportName = m.name;

      if (exportName in pluginModuleIdByExport) {
        const existingPlugin =
          pluginModulesById[pluginModuleIdByExport[exportName]];
        throw new Error(
          `Duplicate export from plugins found ${exportName} (${name} and ${existingPlugin.name})`,
        );
      }

      pluginModuleIdByExport[exportName] = id;
    }
  }

  // create list of plugin to plugin dependencies
  const edges = pluginModules.flatMap(({ module, name, id }) =>
    Object.values(module.dependencies ?? {})
      .map((m): [string, string] | undefined => {
        const resolvedDep = pluginModuleIdByExport[m.name];
        if (!resolvedDep) {
          if (m.isOptional) {
            return undefined;
          }
          throw new Error(
            `Cannot resolve plugin dependency for ${name} (${m.name})`,
          );
        }
        if (resolvedDep === 'built-in') {
          return undefined;
        }
        return [resolvedDep, id];
      })
      .filter((x) => x !== undefined),
  );

  const nodes = pluginModules.map((p) => p.id);

  return toposortOrdered(nodes, edges);
}

export function initializeOrderedPluginModules(
  orderedPluginModules: KeyedPlatformModuleWithPlugin[],
  initialSpecImplementations: Partial<Record<string, PluginSpecImplementation>>,
): Partial<Record<string, PluginSpecImplementation>> {
  const specImplementations = { ...initialSpecImplementations };

  for (const { name, module, pluginId } of orderedPluginModules) {
    const dependencies = module.dependencies
      ? stripUndefinedValues(
          mapValues(module.dependencies, (dep) => {
            const implementation = specImplementations[dep.name];
            if (!implementation && !dep.isOptional) {
              throw new Error(`Plugin ${name} missing dependency ${dep.name}`);
            }
            return implementation;
          }),
        )
      : {};
    const context = { pluginId };
    const exports = module.initialize(dependencies, context);
    Object.entries(module.exports ?? {}).map(([key, spec]) => {
      const exportedImplementation = exports[key] as
        | PluginSpecImplementation
        | undefined;
      if (!exportedImplementation) {
        throw new Error(`Plugin ${name} did not return required export ${key}`);
      }
      specImplementations[spec.name] = exportedImplementation;
    });
  }
  return specImplementations;
}

/**
 * Initialize the plugins based on their interdependencies and creates a store of the plugin implementations
 */
export function initializePlugins(
  plugins: PluginWithPlatformModules[],
  initialSpecImplementations: Record<string, PluginSpecImplementation>,
): PluginImplementationStore {
  const pluginModules = extractPlatformModulesFromPlugins(plugins);

  const pluginModulesById = keyBy(pluginModules, (p) => p.id);
  const orderedModuleIds = getOrderedPluginModuleInitializationSteps(
    pluginModules,
    initialSpecImplementations,
  );

  const specImplementations = initializeOrderedPluginModules(
    orderedModuleIds.map((p) => pluginModulesById[p]),
    initialSpecImplementations,
  );
  return new PluginImplementationStore(specImplementations);
}
