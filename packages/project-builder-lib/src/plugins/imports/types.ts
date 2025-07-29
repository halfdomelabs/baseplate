import type { PluginMetadataWithPaths } from '../metadata/types.js';
import type {
  InitializedPluginSpec,
  PluginSpec,
  PluginSpecImplementationFromSpec,
  PluginSpecWithInitializer,
} from '../spec/types.js';

export type PluginSpecMap = Record<string, PluginSpec>;

export type ExtractPluginImplementationFromSpecMap<T extends PluginSpecMap> = {
  [TKey in keyof T]: PluginSpecImplementationFromSpec<T[TKey]>;
};

export interface PluginInitializerContext {
  pluginKey: string;
}

export interface PluginPlatformModule<
  TImports extends PluginSpecMap = PluginSpecMap,
  TExports extends PluginSpecMap = PluginSpecMap,
> {
  dependencies?: TImports;
  exports?: TExports;
  initialize: (
    dependencies: ExtractPluginImplementationFromSpecMap<TImports>,
    context: PluginInitializerContext,
  ) => ExtractPluginImplementationFromSpecMap<TExports>;
}

export function createPlatformPluginExport<
  TImports extends PluginSpecMap,
  TExports extends PluginSpecMap,
>(
  config: PluginPlatformModule<TImports, TExports>,
): PluginPlatformModule<TImports, TExports> {
  return config;
}

export interface KeyedPluginPlatformModule {
  key: string;
  module: PluginPlatformModule;
}

export interface PluginStore {
  availablePlugins: {
    metadata: PluginMetadataWithPaths;
    modules: KeyedPluginPlatformModule[];
  }[];
  builtinSpecImplementations?: (
    | InitializedPluginSpec
    | PluginSpecWithInitializer
  )[];
}
