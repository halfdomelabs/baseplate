import { z } from 'zod';

import type { GeneratorTaskOutputBuilder } from '@src/output/generator-task-output.js';
import type { TaskPhase } from '@src/phases/types.js';
import type {
  Provider,
  ProviderDependency,
  ProviderExport,
  ProviderExportScope,
  ProviderType,
} from '@src/providers/index.js';
import type { Logger } from '@src/utils/evented-logger.js';

/**
 * The base required fields for a generator descriptor
 */
export const baseDescriptorSchema = z.object({
  /**
   * The name of the generator instance (required if the descriptor is one of an array of children)
   */
  name: z.string().optional(),
  /**
   * The generator to use to generate the descriptor
   */
  generator: z.string(),
});

export type BaseGeneratorDescriptor = z.infer<typeof baseDescriptorSchema>;

/**
 * A map of export names to the provider export type
 */
export type ProviderExportMap<T = Record<string, Provider>> = {
  [key in keyof T]: ProviderExport<T[key]>;
};

/**
 * A map of dependency names to the provider dependency type
 */
export type ProviderDependencyMap<T = Record<string, Provider>> = {
  [key in keyof T]: ProviderType<T[key]> | ProviderDependency<T[key]>;
};

/**
 * Infer the map of the initialized providers from the provider export map
 */
export type InferExportProviderMap<T> = T extends undefined
  ? undefined
  : T extends ProviderExportMap<infer P>
    ? P
    : never;

/**
 * Infer the map of the initialized providers from the provider dependency map
 */
export type InferDependencyProviderMap<T> = T extends undefined
  ? undefined
  : T extends ProviderDependencyMap<infer P>
    ? P
    : never;

interface GeneratorTaskResultProviders<
  ExportMap extends Record<string, Provider> | undefined =
    | Record<string, Provider>
    | undefined,
> {
  /**
   * The providers that are exported by this generator task
   */
  providers: ExportMap;
}

interface GeneratorTaskResultBuildersWithOutputs<
  OutputMap extends Record<string, Provider> | undefined =
    | Record<string, Provider>
    | undefined,
> {
  /**
   * The function to build the output for the generator task
   */
  build: (
    builder: GeneratorTaskOutputBuilder,
  ) => Promise<OutputMap> | OutputMap;
}

interface GeneratorTaskResultBuildersWithNoOutputs {
  /**
   * The function to build the output for the generator task
   */
  build?: (builder: GeneratorTaskOutputBuilder) => Promise<void> | void;
}

type IsEmpty<T> = T extends undefined
  ? true
  : keyof T extends never
    ? true
    : false;

/**
 * The result of a generator task with exported providers
 */
export type GeneratorTaskResult<
  ExportMap extends Record<string, Provider> | undefined =
    | Record<string, Provider>
    | undefined,
  OutputMap extends Record<string, Provider> | undefined =
    | Record<string, Provider>
    | undefined,
> = (IsEmpty<ExportMap> extends true
  ? Record<never, never>
  : GeneratorTaskResultProviders<ExportMap>) &
  (OutputMap extends true
    ? GeneratorTaskResultBuildersWithNoOutputs
    : IsEmpty<OutputMap> extends true
      ? GeneratorTaskResultBuildersWithNoOutputs
      : GeneratorTaskResultBuildersWithOutputs<OutputMap>);

/**
 * The context of the task run
 */
export interface TaskRunContext {
  /**
   * The id of the task
   */
  taskId: string;
}

/**
 * A generator task that has been initialized by the generator config with
 * the descriptor of the generator.
 */
export interface GeneratorTask<
  ExportMap extends ProviderExportMap | undefined =
    | ProviderExportMap
    | undefined,
  DependencyMap extends ProviderDependencyMap = ProviderDependencyMap,
  OutputMap extends ProviderExportMap | undefined =
    | ProviderExportMap
    | undefined,
> {
  /**
   * The name of the generator task (must be unique within the generator)
   */
  name: string;
  /**
   * The providers that are exported by this generator task
   */
  exports?: ExportMap;
  /**
   * The providers that are outputs from this generator task
   */
  outputs?: OutputMap;
  /**
   * The providers that are required by this generator task
   */
  dependencies?: DependencyMap;
  /**
   * The phase of the generator task (otherwise it will be executed before all named phases)
   */
  phase?: TaskPhase | undefined;
  /**
   * Given the resolved dependencies, run the generator task and return
   * the initialized export map and function to build the output for the
   * generator task.
   */
  run: (
    dependencies: InferDependencyProviderMap<DependencyMap>,
    context: TaskRunContext,
  ) => {
    exports: ExportMap;
    outputs: OutputMap;
  } extends {
    exports: undefined;
    outputs: undefined;
  }
    ? // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
      void | GeneratorTaskResult<
        InferExportProviderMap<ExportMap>,
        InferExportProviderMap<OutputMap>
      >
    : GeneratorTaskResult<
        InferExportProviderMap<ExportMap>,
        InferExportProviderMap<OutputMap>
      >;
}

/**
 * A type that can be used to create a generator task with any export, dependency, and output maps
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- needed to prevent the tasks from being provided generic arguments
export type AnyGeneratorTask = GeneratorTask<any, any, any>;

export function createGeneratorTask<
  ExportMap extends ProviderExportMap | undefined = undefined,
  DependencyMap extends ProviderDependencyMap = ProviderDependencyMap,
  OutputMap extends ProviderExportMap | undefined = undefined,
>(
  task: GeneratorTask<ExportMap, DependencyMap, OutputMap>,
): GeneratorTask<ExportMap, DependencyMap, OutputMap> {
  return task;
}

export interface CreateGeneratorContext {
  id: string;
  generatorName: string;
  generatorBaseDirectory: string;
  logger: Logger;
}

/**
 * A generator bundle contains the built generator and its children
 */
export interface GeneratorBundle<
  TaskConfigs extends Record<string, AnyGeneratorTask> = Record<
    string,
    AnyGeneratorTask
  >,
> {
  /**
   * The name of the generator
   */
  name: string;
  /**
   * The directory of the generator
   */
  directory: string;
  /**
   * The name of the generator instance (must be unique if in a list of children)
   */
  instanceName?: string;
  /**
   * The scopes of the generator
   */
  scopes: ProviderExportScope[];
  /**
   * The children of the generator
   */
  children: Record<string, undefined | GeneratorBundle | GeneratorBundle[]>;
  /**
   * The tasks of the generator
   */
  tasks: TaskConfigs;
  /**
   * The phases of the generator that may only contain
   * dynamic tasks and thus need to be pre-registered
   */
  preRegisteredPhases?: TaskPhase[];
}

/**
 * The configuration of a generator that is the default export of a generator module
 */
export interface GeneratorConfig<
  Descriptor extends BaseGeneratorDescriptor = BaseGeneratorDescriptor,
> {
  /**
   * Creates an instance of the generator with a given descriptor and
   * resolved dependencies
   */
  createGenerator: (
    descriptor: Descriptor,
    context: CreateGeneratorContext,
  ) => GeneratorBundle;
}
