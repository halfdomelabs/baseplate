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
  ExportMap extends Record<string, unknown> = Record<string, Provider>,
  TaskOutput = unknown,
> {
  providers?: ExportMap;
  build?: (
    builder: GeneratorTaskOutputBuilder,
  ) => Promise<TaskOutput> | TaskOutput;
}

export type TaskOutputDependencyMap<T = Record<string, unknown>> = {
  [key in keyof T]: SimpleGeneratorTaskOutput<T[key]>;
};

export type InferTaskOutputDependencyMap<T> =
  T extends TaskOutputDependencyMap<infer P> ? P : never;

export interface SimpleGeneratorTaskConfig<
  ExportMap extends ProviderExportMap = Record<string, never>,
  DependencyMap extends ProviderDependencyMap = Record<string, never>,
  TaskDependencyMap extends TaskOutputDependencyMap = Record<string, never>,
  TaskOutput = unknown,
> {
  name: string;
  exports?: ExportMap;
  dependencies?: DependencyMap;
  taskDependencies?: TaskDependencyMap;
  run: (
    dependencies: InferDependencyProviderMap<DependencyMap>,
    taskDependencies: InferTaskOutputDependencyMap<TaskDependencyMap>,
  ) => ExportMap extends Record<string, never>
    ? // eslint-disable-next-line @typescript-eslint/no-invalid-void-type -- we want to allow empty returns for tasks that don't need to return anything
      void | SimpleGeneratorTaskInstance<
        InferExportProviderMap<ExportMap>,
        TaskOutput
      >
    : SimpleGeneratorTaskInstance<
        InferExportProviderMap<ExportMap>,
        TaskOutput
      >;
}

type TaskConfigBuilder<
  ExportMap extends ProviderExportMap,
  DependencyMap extends ProviderDependencyMap,
  TaskDependencyMap extends TaskOutputDependencyMap,
  TaskOutput = unknown,
  Input = never,
> = (
  input: Input,
  taskDependencies?: TaskDependencyMap,
) => SimpleGeneratorTaskConfig<
  ExportMap,
  DependencyMap,
  TaskDependencyMap,
  TaskOutput
>;

export type ExtractTaskOutputFromBuilder<T> =
  T extends TaskConfigBuilder<
    ProviderExportMap,
    ProviderDependencyMap,
    TaskOutputDependencyMap,
    infer TaskOutput
  >
    ? TaskOutput
    : never;

type TaskBuilderMap<T> = {
  [key in keyof T]: TaskConfigBuilder<
    ProviderExportMap,
    ProviderDependencyMap,
    TaskOutputDependencyMap,
    T[key]
  >;
};

export type InferTaskBuilderMap<T> =
  T extends TaskBuilderMap<infer P>
    ? { [key in keyof P]: SimpleGeneratorTaskOutput<P[key]> }
    : never;

export function createTaskConfigBuilder<
  ExportMap extends ProviderExportMap,
  DependencyMap extends ProviderDependencyMap,
  TaskDependencyMap extends TaskOutputDependencyMap,
  TaskOutput = unknown,
  Input = unknown,
>(
  builder: TaskConfigBuilder<
    ExportMap,
    DependencyMap,
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
  TaskDependencyMap,
  TaskOutput
> {
  return builder;
}

export interface GeneratorTaskBuilder<Descriptor = unknown> {
  addTask: <
    ExportMap extends ProviderExportMap = Record<string, never>,
    DependencyMap extends ProviderDependencyMap = Record<string, never>,
    TaskDependencyMap extends TaskOutputDependencyMap = Record<string, never>,
    TaskOutput = unknown,
  >(
    task:
      | SimpleGeneratorTaskConfig<
          ExportMap,
          DependencyMap,
          TaskDependencyMap,
          TaskOutput
        >
      | ((
          descriptor: Descriptor,
        ) => SimpleGeneratorTaskConfig<
          ExportMap,
          DependencyMap,
          TaskDependencyMap,
          TaskOutput
        >),
  ) => SimpleGeneratorTaskOutput<TaskOutput>;
}
