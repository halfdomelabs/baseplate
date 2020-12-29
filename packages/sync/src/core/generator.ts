import { Schema } from 'yup';
import { GeneratorProviderContext, GeneratorBuildContext } from './context';
import { GeneratorDescriptor } from './descriptor';

export type DescriptorSchema<T> = {
  [K in keyof Exclude<T, GeneratorDescriptor>]: Schema<
    Exclude<T, GeneratorDescriptor>[K]
  >;
};

export interface Generator<ProviderTypeMap extends {} = {}> {
  getProviders?: (context: GeneratorProviderContext) => ProviderTypeMap;
  build: (context: GeneratorBuildContext) => Promise<void> | void;
}

export interface ChildGenerator<Descriptor extends GeneratorDescriptor = any> {
  provider?: string;
  defaultDescriptor?: Descriptor;
  multiple?: boolean;
}

export interface GeneratorConfig<
  Descriptor extends GeneratorDescriptor,
  ProviderTypeMap extends {} = {}
> {
  descriptorSchema?: DescriptorSchema<Descriptor>;
  childGenerators?: { [key: string]: ChildGenerator };
  provides?: string[];
  requires?: string[];
  baseDirectory?: string;
  createGenerator: (descriptor: Descriptor) => Generator<ProviderTypeMap>;
}
