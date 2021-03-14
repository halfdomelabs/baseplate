/* eslint-disable @typescript-eslint/no-explicit-any */
import { Schema } from 'yup';
import { GeneratorProviderContext, GeneratorBuildContext } from './context';
import { GeneratorDescriptor } from './descriptor';
import { ProviderDependency, ProviderType } from './provider';

export type DescriptorSchema<T> = {
  [K in keyof Exclude<T, GeneratorDescriptor>]: Schema<
    Exclude<T, GeneratorDescriptor>[K]
  >;
};

export interface Generator<ExportMap extends Record<string, any> = {}> {
  getProviders?: (context: GeneratorProviderContext) => ExportMap;
  build: (context: GeneratorBuildContext) => Promise<void> | void;
}

export interface ChildGenerator<Descriptor extends GeneratorDescriptor = any> {
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
  ExportMap extends ProviderExportMap<any> = ProviderExportMap<any>,
  DependencyMap extends ProviderDependencyMap<any> = ProviderDependencyMap<any>
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
  ExportMap extends ProviderExportMap<any> = any,
  DependencyMap extends ProviderDependencyMap<any> = any
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
