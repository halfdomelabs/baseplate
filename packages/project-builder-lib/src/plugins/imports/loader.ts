import _ from 'lodash';
import toposort from 'toposort';

import { KeyedPluginPlatformModule } from './types.js';
import { ZodPluginImplementationStore } from '../schema/store.js';
import { PluginSpecImplementation } from '../spec/types.js';
import { notEmpty } from '@src/utils/array.js';

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
  const pluginModulesById = _.keyBy(pluginModules, (p) => p.id);

  // create export map of plugin ID to export spec name
  const pluginModuleIdByExport: Record<string, string> = _.mapValues(
    initialSpecImplementations,
    () => 'built-in',
  );
  pluginModules.forEach(({ name, module, id }) => {
    Object.values(module.exports ?? {}).forEach((m) => {
      const exportName = m.name;

      if (exportName in pluginModuleIdByExport) {
        const existingPlugin =
          pluginModulesById[pluginModuleIdByExport[exportName]];
        throw new Error(
          `Duplicate export from plugins found ${exportName} (${name} and ${existingPlugin.name})`,
        );
      }

      pluginModuleIdByExport[exportName] = id;
    });
  });

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
      .filter(notEmpty),
  );

  const nodes = pluginModules.map((p) => p.id);

  return toposort.array(nodes, edges);
}

export function initializeOrderedPluginModules(
  orderedPluginModules: KeyedPlatformModuleWithPlugin[],
  initialSpecImplementations: Record<string, PluginSpecImplementation>,
): Record<string, PluginSpecImplementation> {
  const specImplementations = { ...initialSpecImplementations };

  orderedPluginModules.forEach(({ name, module, pluginId }) => {
    const dependencies = _.mapValues(module.dependencies, (dep) => {
      const implementation = specImplementations[dep.name];
      if (!implementation && !dep.isOptional) {
        throw new Error(`Plugin ${name} missing dependency ${dep.name}`);
      }
      return implementation;
    });
    const context = { pluginId };
    const exports = module.initialize(dependencies, context) ?? {};
    Object.entries(module.exports ?? {}).map(([key, spec]) => {
      const exportedImplementation = exports[key];
      if (!exportedImplementation) {
        throw new Error(`Plugin ${name} did not return required export ${key}`);
      }
      specImplementations[spec.name] = exportedImplementation;
    });
  });
  return specImplementations;
}

/**
 * Initialize the plugins based on their interdependencies and creates a store of the plugin implementations
 */
export function initializePlugins(
  plugins: PluginWithPlatformModules[],
  initialSpecImplementations: Record<string, PluginSpecImplementation>,
): ZodPluginImplementationStore {
  const pluginModules = extractPlatformModulesFromPlugins(plugins);

  const pluginModulesById = _.keyBy(pluginModules, (p) => p.id);
  const orderedModuleIds = getOrderedPluginModuleInitializationSteps(
    pluginModules,
    initialSpecImplementations,
  );

  const specImplementations = initializeOrderedPluginModules(
    orderedModuleIds.map((p) => pluginModulesById[p]),
    initialSpecImplementations,
  );
  return new ZodPluginImplementationStore(specImplementations);
}
