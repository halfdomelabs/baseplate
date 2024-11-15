import type { z } from 'zod';

import type { BaseGeneratorDescriptor } from '../core/index.js';

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

export type GeneratorDescriptor<TSchema extends z.ZodType = z.ZodUnknown> =
  Partial<DescriptorWithChildren> & z.infer<TSchema>;

export interface ChildGeneratorConfig {
  provider?: string;
  isMultiple?: boolean;
  /**
   * Whether to default to null if no config is provided.
   */
  defaultToNullIfEmpty?: boolean;
  defaultDescriptor?: BaseGeneratorDescriptor & Record<string, unknown>;
}
