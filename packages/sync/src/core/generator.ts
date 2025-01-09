import type { Logger } from '../utils/evented-logger.js';
import type { BaseGeneratorDescriptor } from './descriptor.js';
import type { GeneratorOutputBuilder } from './generator-output.js';
import type {
  Provider,
  ProviderDependency,
  ProviderExport,
  ProviderExportScope,
  ProviderType,
} from './provider.js';

/**
 * An instance of a generator that has providers for other
 * generators to consume and can then add its own files
 */
export interface GeneratorTaskInstance<
  ExportMap extends Record<string, unknown> = Record<string, Provider>,
> {
  getProviders?: () => ExportMap;
  build?: (builder: GeneratorOutputBuilder) => Promise<void> | void;
}

export type ProviderExportMap<T = Record<string, Provider>> = {
  [key in keyof T]: ProviderExport<T[key]>;
};

export type ProviderDependencyMap<T = Record<string, Provider>> = {
  [key in keyof T]: ProviderType<T[key]> | ProviderDependency<T[key]>;
};

export type InferExportProviderMap<T> =
  T extends ProviderExportMap<infer P> ? P : never;
export type InferDependencyProviderMap<T> =
  T extends ProviderDependencyMap<infer P> ? P : never;

export type ChildDescriptorOrReference = BaseGeneratorDescriptor | string;

export interface ParseDescriptorContext {
  generatorMap: Record<string, GeneratorConfig | undefined>;
  id: string;
  logger: Logger;
}

export interface GeneratorTask<
  ExportMap extends ProviderExportMap = ProviderExportMap,
  DependencyMap extends ProviderDependencyMap = ProviderDependencyMap,
> {
  name: string;
  exports?: ExportMap;
  dependencies?: DependencyMap;
  taskDependencies: string[];
  run: (
    dependencies: InferDependencyProviderMap<DependencyMap>,
  ) => GeneratorTaskInstance<InferExportProviderMap<ExportMap>>;
}

/**
 * Configuration of a generator
 */
export interface GeneratorConfig<
  Descriptor extends BaseGeneratorDescriptor = BaseGeneratorDescriptor,
> {
  /**
   * All children of the generator will be part of these scopes
   */
  scopes?: ProviderExportScope[];
  /**
   * Parses descriptors and extracts out the structure of the generator
   */
  parseDescriptor: (
    descriptor: Descriptor,
    context: ParseDescriptorContext,
  ) => {
    validatedDescriptor?: Descriptor;
    children?: Record<
      string,
      ChildDescriptorOrReference | ChildDescriptorOrReference[] | null
    >;
  };
  /**
   * Creates an instance of the generator with a given descriptor and
   * resolved dependencies
   */
  createGenerator: (descriptor: Descriptor) => GeneratorTask[];
}

/**
 * Helper function for creating a generator config (for typing)
 */
export function createGeneratorConfig<
  Descriptor extends BaseGeneratorDescriptor,
>(config: GeneratorConfig<Descriptor>): GeneratorConfig<Descriptor> {
  return config;
}
