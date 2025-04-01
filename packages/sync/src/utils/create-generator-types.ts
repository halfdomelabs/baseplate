import type {
  BaseGeneratorDescriptor,
  GeneratorTask,
  ProviderDependencyMap,
  ProviderExportMap,
} from '@src/generators/generators.js';

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

export interface ChildGeneratorConfig {
  provider?: string;
  isMultiple?: boolean;
  /**
   * Whether to default to null if no config is provided.
   */
  defaultToNullIfEmpty?: boolean;
  defaultDescriptor?: BaseGeneratorDescriptor & Record<string, unknown>;
}

export interface GeneratorTaskBuilder {
  generatorName: string;
  addTask: <
    ExportMap extends ProviderExportMap | undefined = undefined,
    DependencyMap extends ProviderDependencyMap = Record<never, never>,
    OutputMap extends ProviderExportMap | undefined = undefined,
  >(
    task: GeneratorTask<ExportMap, DependencyMap, OutputMap>,
  ) => void;
}
