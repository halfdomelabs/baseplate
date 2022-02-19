import { BaseGeneratorDescriptor } from './descriptor';
import { GeneratorOutputBuilder } from './generator-output';
import {
  Provider,
  ProviderDependency,
  ProviderType,
  ProviderExport,
} from './provider';

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

export type ProviderExportMap<T = Record<string, Provider>> = {
  [key in keyof T]: ProviderType<T[key]> | ProviderExport<T[key]>;
};

export type ProviderDependencyMap<T = Record<string, Provider>> = {
  [key in keyof T]: ProviderType<T[key]> | ProviderDependency<T[key]>;
};

type InferExportProviderMap<T> = T extends ProviderExportMap<infer P>
  ? P
  : never;
type InferDependencyProviderMap<T> = T extends ProviderDependencyMap<infer P>
  ? P
  : never;

export type ChildDescriptorOrReference = BaseGeneratorDescriptor | string;

export interface ParseDescriptorContext {
  generatorMap: Record<string, GeneratorConfig>;
  id: string;
}

/**
 * Configuration of a generator
 */
export interface GeneratorConfig<
  Descriptor extends BaseGeneratorDescriptor = BaseGeneratorDescriptor,
  ExportMap extends ProviderExportMap = ProviderExportMap<
    Record<string, Provider>
  >,
  DependencyMap extends ProviderDependencyMap = ProviderDependencyMap<
    Record<string, Provider>
  >
> {
  /**
   * A map of the providers the generator exports
   */
  exports?: ExportMap;
  /**
   * Parses descriptors and extracts out the structure of the generator
   */
  parseDescriptor: (
    descriptor: Descriptor,
    context: ParseDescriptorContext
  ) => {
    dependencies?: DependencyMap;
    validatedDescriptor?: Descriptor;
    children?: {
      [key: string]:
        | ChildDescriptorOrReference
        | ChildDescriptorOrReference[]
        | null;
    };
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
