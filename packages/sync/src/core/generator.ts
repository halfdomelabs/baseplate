import { Schema } from 'yup';
import { GeneratorContext } from './context';
import { GeneratorDescriptor } from './descriptor';

export type DescriptorSchema<T> = {
  [K in keyof Exclude<T, GeneratorDescriptor>]: Schema<
    Exclude<T, GeneratorDescriptor>[K]
  >;
};

export interface ChildGenerator {
  provider?: string;
  defaultGenerator?: string;
  multiple?: boolean;
  subdirectory?: string;
}

export interface Generator<
  Descriptor extends GeneratorDescriptor,
  Provider = null
> {
  descriptorSchema?: DescriptorSchema<Descriptor>;
  childGenerators?: { [key: string]: ChildGenerator };
  provides?: string[];
  requires?: string[];
  getProvider?: (descriptor: Descriptor, context: GeneratorContext) => Provider;
  build: (
    descriptor: Descriptor,
    context: GeneratorContext
  ) => Promise<void> | void;
  baseDirectory?: string;
}
