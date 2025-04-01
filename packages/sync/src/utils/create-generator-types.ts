import type {
  BaseGeneratorDescriptor,
  InferDependencyProviderMap,
  InferExportProviderMap,
  ProviderDependencyMap,
  ProviderExportMap,
} from '@src/generators/generators.js';
import type { GeneratorTaskOutputBuilder } from '@src/output/generator-task-output.js';
import type { Provider } from '@src/providers/providers.js';

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

interface SimpleGeneratorTaskInstance<
  ExportMap extends Record<string, Provider> | undefined = Record<
    string,
    Provider
  >,
  OutputMap extends Record<string, Provider> | undefined =
    | Record<string, Provider>
    | undefined,
> {
  providers?: ExportMap;
  build?: (
    builder: GeneratorTaskOutputBuilder,
  ) => OutputMap extends undefined
    ? void | Promise<void>
    : Promise<OutputMap> | OutputMap;
}

export interface SimpleGeneratorTaskConfig<
  ExportMap extends ProviderExportMap | undefined =
    | ProviderExportMap
    | undefined,
  DependencyMap extends ProviderDependencyMap = ProviderDependencyMap,
  OutputMap extends ProviderExportMap | undefined =
    | ProviderExportMap
    | undefined,
> {
  name: string;
  exports?: ExportMap;
  dependencies?: DependencyMap;
  outputs?: OutputMap;
  run: (dependencies: InferDependencyProviderMap<DependencyMap>) => {
    exports: ExportMap;
    outputs: OutputMap;
  } extends { exports: undefined; outputs: undefined }
    ? // eslint-disable-next-line @typescript-eslint/no-invalid-void-type -- we want to allow empty returns for tasks that don't need to return anything
      void | SimpleGeneratorTaskInstance<
        InferExportProviderMap<ExportMap>,
        InferExportProviderMap<OutputMap>
      >
    : SimpleGeneratorTaskInstance<
        InferExportProviderMap<ExportMap>,
        InferExportProviderMap<OutputMap>
      >;
}

export interface GeneratorTaskBuilder {
  generatorName: string;
  addTask: <
    ExportMap extends ProviderExportMap | undefined = undefined,
    DependencyMap extends ProviderDependencyMap = Record<never, never>,
    OutputMap extends ProviderExportMap | undefined = undefined,
  >(
    task: SimpleGeneratorTaskConfig<ExportMap, DependencyMap, OutputMap>,
  ) => void;
}
