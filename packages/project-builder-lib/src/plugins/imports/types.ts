import type { PluginMetadataWithPaths } from '../metadata/types.js';
import type { InferPluginSpecInit, PluginSpec } from '../spec/types.js';

/**
 * A map of spec names to plugin specs.
 */
type PluginSpecMap = Record<string, PluginSpec>;

/**
 * Extracts init interfaces from a spec map.
 * Used for providing dependencies to plugin initializers.
 */
type ExtractInitFromSpecMap<T extends PluginSpecMap> = {
  [TKey in keyof T]: InferPluginSpecInit<T[TKey]>;
};

/**
 * Context provided to plugin module initializers.
 */
export interface ModuleContext {
  /** Full module key: "{pluginKey}/{moduleDir}/{name}" or "core/{platform}/{name}" */
  moduleKey: string;
  /** The plugin key (or "core" for core modules) */
  pluginKey: string;
}

/**
 * A plugin module defines how a plugin initializes and registers with specs.
 */
export interface PluginModule<TImports extends PluginSpecMap = PluginSpecMap> {
  /** Unique name for this module within its plugin/core directory */
  name: string;
  /** Specs this module depends on (will be resolved before initialize is called) */
  dependencies?: TImports;
  /**
   * Initialize the plugin module and register with the dependent specs.
   */
  initialize: (
    dependencies: ExtractInitFromSpecMap<TImports>,
    context: ModuleContext,
  ) => void;
}

/**
 * Creates a plugin module export.
 *
 * @example
 * ```typescript
 * export default createPluginModule({
 *   name: 'node',
 *   dependencies: {
 *     config: pluginConfigSpec,
 *   },
 *   initialize: ({ config }, ctx) => {
 *     config.registerSchemaCreator(ctx.pluginKey, createSchema);
 *   },
 * });
 * ```
 */
export function createPluginModule<TImports extends PluginSpecMap>(
  config: PluginModule<TImports>,
): PluginModule {
  return config as PluginModule;
}

/**
 * A plugin module with a module directory.
 */
export interface PluginModuleWithDirectory {
  /** The module directory within the plugin (e.g., "core", "admin") */
  directory: string;
  /** The module itself */
  module: PluginModule;
}

/**
 * A plugin module with a key and plugin key metadata.
 */
export interface PluginModuleWithKey {
  /** The unique key for this module (e.g., "core/server/auth-compiler" or "auth/auth0/core/web") */
  key: string;
  /** The plugin key (or "core" for core modules) */
  pluginKey: string;
  /**
   * The module itself
   */
  module: PluginModule;
}

/**
 * The plugin store containing all available plugins and additional core modules (project-builder-lib core modules are always included).
 */
export interface PluginStore {
  availablePlugins: {
    metadata: PluginMetadataWithPaths;
    modules: PluginModuleWithDirectory[];
  }[];
  coreModules: PluginModuleWithKey[];
}
