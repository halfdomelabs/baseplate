import { BaseGeneratorDescriptor } from './descriptor';
import { GeneratorOutputBuilder } from './generator-output';
import { Provider, ProviderDependency, ProviderType } from './provider';

/**
 * An instance of a generator that has providers for other
 * generators to consume and can then add its own files
 */
export interface GeneratorInstance<
  ExportMap extends Record<string, unknown> = Record<string, Provider>
> {
  getProviders?: () => ExportMap;
  build: (builder: GeneratorOutputBuilder) => Promise<void> | void;
}

export type ProviderExportMap<T = Record<string, unknown>> = {
  [key in keyof T]: ProviderType<T[key]>;
};

export type ProviderDependencyMap<T = Record<string, unknown>> = {
  [key in keyof T]: ProviderType<T[key]> | ProviderDependency<T[key]>;
};

type InferExportProviderMap<T> = T extends ProviderExportMap<infer P>
  ? P
  : never;
type InferDependencyProviderMap<T> = T extends ProviderDependencyMap<infer P>
  ? P
  : never;

export type ChildDescriptorOrReference = BaseGeneratorDescriptor | string;

/**
 * Configuration of a generator
 */
export interface GeneratorConfig<
  Descriptor extends BaseGeneratorDescriptor = BaseGeneratorDescriptor,
  ExportMap extends ProviderExportMap<
    Record<string, unknown>
  > = ProviderExportMap<Record<string, Provider>>,
  DependencyMap extends ProviderDependencyMap<
    Record<string, unknown>
  > = ProviderDependencyMap<Record<string, Provider>>
> {
  /**
   * Parses descriptors and extracts out the structure of the generator
   */
  parseDescriptor: (descriptor: Descriptor) => {
    dependencies?: DependencyMap;
    children?: {
      [key: string]: ChildDescriptorOrReference | ChildDescriptorOrReference[];
    };
    exports?: ExportMap;
  };
  /**
   * Creates an instance of the generator with a given descriptor and
   * resolved dependencies
   */
  createGenerator: (
    descriptor: Descriptor,
    dependencies: InferDependencyProviderMap<DependencyMap>
  ) => GeneratorInstance<InferExportProviderMap<ExportMap>>;
}

/**
 * Helper function for creating a generator config (for typing)
 */
export function createGeneratorConfig<
  Descriptor extends BaseGeneratorDescriptor,
  ExportMap extends ProviderExportMap<unknown> = ProviderExportMap<Provider>,
  DependencyMap extends ProviderDependencyMap<unknown> = ProviderDependencyMap<Provider>
>(
  config: GeneratorConfig<Descriptor, ExportMap, DependencyMap>
): GeneratorConfig<Descriptor, ExportMap, DependencyMap> {
  return config;
}
