import { toposort } from '@baseplate-dev/utils';

import type { BasePluginDefinition } from '#src/schema/plugins/definition.js';

import { pluginEntityType } from '#src/schema/plugins/entity-types.js';

import type { PluginMetadataWithPaths } from '../metadata/types.js';
import type { PluginStore } from './types.js';

import { getPluginMetadataByKey } from './utils.js';

/**
 * Builds a set of fullyQualifiedNames for all enabled plugins in a definition.
 *
 * @param pluginStore The plugin store containing all available plugins
 * @param enabledPlugins The enabled plugin definitions from the project definition
 * @returns Set of fullyQualifiedNames for enabled plugins
 */
export function buildEnabledPluginFqnSet(
  pluginStore: PluginStore,
  enabledPlugins: BasePluginDefinition[],
): Set<string> {
  const fqns = new Set<string>();
  for (const plugin of enabledPlugins) {
    const key = pluginEntityType.keyFromId(plugin.id);
    const metadata = getPluginMetadataByKey(pluginStore, key);
    if (metadata) {
      fqns.add(metadata.fullyQualifiedName);
    }
  }
  return fqns;
}

/**
 * Validates that the plugin dependency graph has no circular dependencies.
 *
 * Uses topological sort to detect cycles. Dependencies referencing plugins
 * not in `availablePlugins` are silently skipped (they may be uninstalled).
 *
 * @throws ToposortCyclicalDependencyError if a circular dependency is detected
 */
export function validatePluginDependencyGraph(
  availablePlugins: PluginStore['availablePlugins'],
): void {
  const allNames = new Set(
    availablePlugins.map((p) => p.metadata.fullyQualifiedName),
  );

  const nodes = [...allNames];
  const edges: [string, string][] = [];

  for (const { metadata } of availablePlugins) {
    for (const dep of metadata.pluginDependencies ?? []) {
      if (allNames.has(dep.plugin)) {
        edges.push([metadata.fullyQualifiedName, dep.plugin]);
      }
    }
  }

  // toposort throws ToposortCyclicalDependencyError on cycles
  toposort(nodes, edges);
}

export interface ResolvedPluginDependency {
  metadata: PluginMetadataWithPaths;
  optional: boolean;
}

/**
 * Resolves a plugin's declared dependencies to their metadata objects.
 *
 * @param pluginStore The plugin store containing all available plugins
 * @param pluginKey The key of the plugin whose dependencies to resolve
 * @returns Array of resolved dependencies with metadata and optional flag
 */
export function getPluginDependencies(
  pluginStore: PluginStore,
  pluginKey: string,
): ResolvedPluginDependency[] {
  const plugin = pluginStore.availablePlugins.find(
    (p) => p.metadata.key === pluginKey,
  );
  if (!plugin) {
    return [];
  }

  const deps = plugin.metadata.pluginDependencies ?? [];

  return deps.flatMap((dep) => {
    const target = pluginStore.availablePlugins.find(
      (p) => p.metadata.fullyQualifiedName === dep.plugin,
    );
    if (!target) {
      return [];
    }
    return [{ metadata: target.metadata, optional: dep.optional ?? false }];
  });
}

/**
 * Returns the required (non-optional) plugin dependencies that are not currently enabled.
 *
 * @param pluginStore The plugin store containing all available plugins
 * @param pluginKey The key of the plugin to check
 * @param enabledPluginFqns Set of fullyQualifiedNames for currently enabled plugins
 * @returns Array of unmet required dependencies with metadata
 */
export function getUnmetPluginDependencies(
  pluginStore: PluginStore,
  pluginKey: string,
  enabledPluginFqns: Set<string>,
): PluginMetadataWithPaths[] {
  const deps = getPluginDependencies(pluginStore, pluginKey);

  return deps
    .filter(
      (dep) =>
        !dep.optional &&
        !enabledPluginFqns.has(dep.metadata.fullyQualifiedName),
    )
    .map((dep) => dep.metadata);
}
