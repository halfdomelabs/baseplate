import { assertNoDuplicates } from '@baseplate-dev/utils';
import { mapValues } from 'es-toolkit';

import { stripUndefinedValues } from '#src/utils/strip.js';

import type { PluginSpec, PluginSpecInitializerResult } from '../spec/types.js';
import type { PluginModuleWithKey } from './types.js';

import { runInPluginContext } from '../context/plugin-context.js';
import { PluginSpecStore } from '../store/store.js';

/**
 * Initialize ordered plugin modules.
 * Each module's initialize function is called within a plugin context.
 */
export function initializeOrderedModules(
  orderedModules: PluginModuleWithKey[],
): Map<string, PluginSpecInitializerResult> {
  const instances = new Map<string, PluginSpecInitializerResult>();

  function use<TInit extends object, TUse extends object>(
    spec: PluginSpec<TInit, TUse>,
  ): PluginSpecInitializerResult<TInit, TUse> {
    if (!instances.has(spec.name)) {
      const instance = spec.initializer();
      instances.set(spec.name, instance);
    }
    return instances.get(spec.name) as PluginSpecInitializerResult<TInit, TUse>;
  }

  for (const { module, key: moduleKey, pluginKey } of orderedModules) {
    // Resolve dependencies by getting their setup interfaces
    const dependencies = module.dependencies
      ? stripUndefinedValues(
          mapValues(module.dependencies, (spec) => use(spec).init),
        )
      : {};

    // Run initialize within plugin context for source tracking
    runInPluginContext({ moduleKey, pluginKey }, () => {
      module.initialize(dependencies, { moduleKey, pluginKey });
    });
  }

  return instances;
}

/**
 * Initialize the plugins based on their interdependencies.
 * Returns a store that can be used to access spec implementations.
 */
export function initializePlugins(
  pluginModules: PluginModuleWithKey[],
  pluginKeys: string[] = [],
): PluginSpecStore {
  assertNoDuplicates(pluginModules, 'plugin modules', (m) => m.key);

  const instances = initializeOrderedModules(pluginModules);

  return new PluginSpecStore(instances, pluginKeys);
}
