import { BaseGeneratorDescriptor } from '../core/index.js';

export interface DescriptorWithChildren extends BaseGeneratorDescriptor {
  children?: Record<
    string,
    | Partial<BaseGeneratorDescriptor>
    | string
    | Partial<BaseGeneratorDescriptor>[]
    | string[]
  >;
}

export interface ChildGeneratorConfig {
  provider?: string;
  isMultiple?: boolean;
  /**
   * Whether to default to null if no config is provided.
   */
  defaultToNullIfEmpty?: boolean;
  defaultDescriptor?: BaseGeneratorDescriptor & Record<string, unknown>;
}
