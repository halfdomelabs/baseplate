import type { BaseGeneratorDescriptor } from '@src/generators/generators.js';

export interface DescriptorWithChildren extends BaseGeneratorDescriptor {
  children?: GeneratorDescriptorChildren;
}

export type GenericDescriptorWithChildren = DescriptorWithChildren &
  Record<string, unknown>;

export type GeneratorDescriptorChildren = Record<
  string,
  | Partial<GenericDescriptorWithChildren>
  | Partial<GenericDescriptorWithChildren>[]
  | Partial<DescriptorWithChildren>
  | Partial<DescriptorWithChildren>[]
  | string
  | string[]
  | undefined
>;
