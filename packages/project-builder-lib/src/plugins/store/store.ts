import type { PluginSpec, PluginSpecInitializerResult } from '../spec/types.js';

/**
 * Store for managing plugin spec instances with lazy initialization.
 *
 * Each spec is initialized once on first access, and both its init and use
 * interfaces are cached for subsequent access.
 */
export class PluginSpecStore {
  private instances: Map<string, PluginSpecInitializerResult>;

  constructor(instances = new Map<string, PluginSpecInitializerResult>()) {
    this.instances = instances;
  }

  /**
   * Gets the use interface for a spec.
   *
   * Use this after initialization to access registered items.
   * The use interface provides read-only methods for consumption.
   *
   * @param spec - The plugin spec to get the use interface for
   * @returns The use interface for the spec
   */
  use<TUse extends object, TInit extends object>(
    spec: PluginSpec<TInit, TUse>,
  ): TUse {
    let specInstance = this.instances.get(spec.name) as
      | PluginSpecInitializerResult<TInit, TUse>
      | undefined;
    if (!specInstance) {
      specInstance = spec.initializer();
      this.instances.set(spec.name, specInstance);
    }

    return specInstance.use();
  }

  // [TODO: 2026-06-01] Remove this method
  getPluginSpec<TInit extends object, TUse extends object>(
    spec: PluginSpec<TInit, TUse>,
  ): TUse {
    return this.use(spec);
  }
}
