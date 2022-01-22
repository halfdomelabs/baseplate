/* eslint-disable @typescript-eslint/no-explicit-any */
import { BaseSchema } from 'yup';
import { GeneratorBuildContext } from './context';
import { GeneratorDescriptor } from './descriptor';
import { Provider, ProviderDependency, ProviderType } from './provider';

export type DescriptorSchema<T> = {
  [K in keyof Exclude<T, GeneratorDescriptor>]: BaseSchema<
    Exclude<T, GeneratorDescriptor>[K]
  >;
};

export interface Generator<
  ExportMap extends Record<string, any> = Record<string, Provider>
> {
  getProviders?: () => ExportMap;
  build: (context: GeneratorBuildContext) => Promise<void> | void;
}

export interface ChildGenerator<
  Descriptor extends GeneratorDescriptor = GeneratorDescriptor
> {
  provider?: ProviderType | string;
  defaultDescriptor?: Descriptor;
  multiple?: boolean;
  required?: boolean;
}

export type ProviderExportMap<T> = {
  [key in keyof T]: ProviderType<T[key]>;
};

export type ProviderDependencyMap<T> = {
  [key in keyof T]: ProviderType<T[key]> | ProviderDependency<T[key]>;
};

type InferExportProviderMap<T> = T extends ProviderExportMap<infer P>
  ? P
  : never;
type InferDependencyProviderMap<T> = T extends ProviderDependencyMap<infer P>
  ? P
  : never;

export interface GeneratorConfig<
  Descriptor extends GeneratorDescriptor,
  ExportMap extends ProviderExportMap<any> = ProviderExportMap<
    Record<string, Provider>
  >,
  DependencyMap extends ProviderDependencyMap<any> = ProviderDependencyMap<
    Record<string, Provider>
  >
> {
  descriptorSchema?: DescriptorSchema<Descriptor>;
  descriptorReferences?: ProviderDependencyMap<any>;
  childGenerators?: { [key: string]: ChildGenerator };
  exports?: ExportMap;
  dependsOn?: DependencyMap;
  baseDirectory?: string;
  createGenerator: (
    descriptor: Descriptor,
    dependencies: InferDependencyProviderMap<DependencyMap>
  ) => Generator<InferExportProviderMap<ExportMap>>;
}

export function createGeneratorConfig<
  Descriptor extends GeneratorDescriptor,
  ExportMap extends ProviderExportMap<any> = ProviderExportMap<Provider>,
  DependencyMap extends ProviderDependencyMap<any> = ProviderDependencyMap<Provider>
>(
  config: GeneratorConfig<Descriptor, ExportMap, DependencyMap>
): GeneratorConfig<Descriptor, ExportMap, DependencyMap> {
  return config;
}

export function createGeneratorDescriptor<
  Descriptor extends GeneratorDescriptor
>(descriptor: DescriptorSchema<Descriptor>): DescriptorSchema<Descriptor> {
  return descriptor;
}
