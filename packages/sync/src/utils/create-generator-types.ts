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

/**
 * The output of a simple generator task.
 */
export interface SimpleGeneratorTaskOutput<TaskOutput = void> {
  name: string;
  getOutput: () => TaskOutput;
}

interface SimpleGeneratorTaskInstance<
  ExportMap extends Record<string, Provider> | undefined = Record<
    string,
    Provider
  >,
  OutputMap extends Record<string, Provider> | undefined =
    | Record<string, Provider>
    | undefined,
  TaskOutput = unknown,
> {
  providers?: ExportMap;
  build?: (
    builder: GeneratorTaskOutputBuilder,
    addTaskOutput: (output: TaskOutput) => void,
  ) => OutputMap extends undefined
    ? void | Promise<void>
    : Promise<OutputMap> | OutputMap;
}

export type TaskOutputDependencyMap<T = Record<string, unknown>> = {
  [key in keyof T]: SimpleGeneratorTaskOutput<T[key]>;
};

export type InferTaskOutputDependencyMap<T> =
  T extends TaskOutputDependencyMap<infer P> ? P : never;

export interface SimpleGeneratorTaskConfig<
  ExportMap extends ProviderExportMap | undefined =
    | ProviderExportMap
    | undefined,
  DependencyMap extends ProviderDependencyMap = ProviderDependencyMap,
  OutputMap extends ProviderExportMap | undefined =
    | ProviderExportMap
    | undefined,
  TaskDependencyMap extends TaskOutputDependencyMap = TaskOutputDependencyMap,
  TaskOutput = unknown,
> {
  name: string;
  exports?: ExportMap;
  dependencies?: DependencyMap;
  outputs?: OutputMap;
  taskDependencies?: TaskDependencyMap;
  run: (
    dependencies: InferDependencyProviderMap<DependencyMap>,
    taskDependencies: InferTaskOutputDependencyMap<TaskDependencyMap>,
  ) => {
    exports: ExportMap;
    outputs: OutputMap;
  } extends { exports: undefined; outputs: undefined }
    ? // eslint-disable-next-line @typescript-eslint/no-invalid-void-type -- we want to allow empty returns for tasks that don't need to return anything
      void | SimpleGeneratorTaskInstance<
        InferExportProviderMap<ExportMap>,
        InferExportProviderMap<OutputMap>,
        TaskOutput
      >
    : SimpleGeneratorTaskInstance<
        InferExportProviderMap<ExportMap>,
        InferExportProviderMap<OutputMap>,
        TaskOutput
      >;
}

type TaskConfigBuilder<
  ExportMap extends ProviderExportMap | undefined,
  DependencyMap extends ProviderDependencyMap,
  OutputMap extends ProviderExportMap | undefined,
  TaskDependencyMap extends TaskOutputDependencyMap,
  TaskOutput = unknown,
  Input = never,
> = (
  input: Input,
  taskDependencies?: TaskDependencyMap,
) => SimpleGeneratorTaskConfig<
  ExportMap,
  DependencyMap,
  OutputMap,
  TaskDependencyMap,
  TaskOutput
>;

export type ExtractTaskOutputFromBuilder<T> =
  T extends TaskConfigBuilder<
    ProviderExportMap,
    ProviderDependencyMap,
    ProviderExportMap,
    TaskOutputDependencyMap,
    infer TaskOutput
  >
    ? TaskOutput
    : never;

type TaskBuilderMap<T> = {
  [key in keyof T]: TaskConfigBuilder<
    ProviderExportMap,
    ProviderDependencyMap,
    ProviderExportMap,
    TaskOutputDependencyMap,
    T[key]
  >;
};

export type InferTaskBuilderMap<T> =
  T extends TaskBuilderMap<infer P>
    ? { [key in keyof P]: SimpleGeneratorTaskOutput<P[key]> }
    : never;

export function createTaskConfigBuilder<
  ExportMap extends ProviderExportMap | undefined = undefined,
  DependencyMap extends ProviderDependencyMap = Record<never, never>,
  OutputMap extends ProviderExportMap | undefined = undefined,
  TaskDependencyMap extends TaskOutputDependencyMap = Record<string, never>,
  TaskOutput = unknown,
  Input = unknown,
>(
  builder: TaskConfigBuilder<
    ExportMap,
    DependencyMap,
    OutputMap,
    TaskDependencyMap,
    TaskOutput,
    Input
  >,
): (
  input: Input,
  taskDependencies?: TaskDependencyMap,
) => SimpleGeneratorTaskConfig<
  ExportMap,
  DependencyMap,
  OutputMap,
  TaskDependencyMap,
  TaskOutput
> {
  return builder;
}

export interface GeneratorTaskBuilder<Descriptor = unknown> {
  addTask: <
    ExportMap extends ProviderExportMap | undefined = undefined,
    DependencyMap extends ProviderDependencyMap = Record<never, never>,
    OutputMap extends ProviderExportMap | undefined = undefined,
    TaskDependencyMap extends TaskOutputDependencyMap = Record<string, never>,
    TaskOutput = unknown,
  >(
    task:
      | SimpleGeneratorTaskConfig<
          ExportMap,
          DependencyMap,
          OutputMap,
          TaskDependencyMap,
          TaskOutput
        >
      | ((
          descriptor: Descriptor,
        ) => SimpleGeneratorTaskConfig<
          ExportMap,
          DependencyMap,
          OutputMap,
          TaskDependencyMap,
          TaskOutput
        >),
  ) => SimpleGeneratorTaskOutput<TaskOutput>;
}
