import { z } from 'zod';

import type { GeneratorTaskOutputBuilder } from '@src/output/generator-task-output.js';
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

export type InferGeneratorDescriptor<T> =
  T extends z.ZodType<infer D>
    ? D &
        BaseGeneratorDescriptor & {
          children?: Record<string, unknown>;
        }
    : never;

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
export type InferExportProviderMap<T> =
  T extends ProviderExportMap<infer P> ? P : never;

/**
 * Infer the map of the initialized providers from the provider dependency map
 */
export type InferDependencyProviderMap<T> =
  T extends ProviderDependencyMap<infer P> ? P : never;

/**
 * The result of a generator task without any exported providers
 */
export interface GeneratorTaskResultWithNoExports {
  /**
   * The function to build the output for the generator task
   */
  build?: (builder: GeneratorTaskOutputBuilder) => Promise<void> | void;
}

/**
 * The result of a generator task with exported providers
 */
export interface GeneratorTaskResult<
  ExportMap extends Record<string, unknown> = Record<string, Provider>,
> extends GeneratorTaskResultWithNoExports {
  /**
   * The providers that are exported by this generator task
   */
  getProviders?: () => ExportMap;
  /**
   * The function to build the output for the generator task
   */
  build?: (builder: GeneratorTaskOutputBuilder) => Promise<void> | void;
}

/**
 * A generator task that has been initialized by the generator config with
 * the descriptor of the generator.
 */
export interface GeneratorTask<
  ExportMap extends ProviderExportMap = ProviderExportMap,
  DependencyMap extends ProviderDependencyMap = ProviderDependencyMap,
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
   * The providers that are required by this generator task
   */
  dependencies?: DependencyMap;
  /**
   * The names of the generator tasks that must be run before this one
   */
  taskDependencies: string[];
  /**
   * Given the resolved dependencies, run the generator task and return
   * the initialized export map and function to build the output for the
   * generator task.
   */
  run: (
    dependencies: InferDependencyProviderMap<DependencyMap>,
  ) => keyof ExportMap extends never
    ? GeneratorTaskResultWithNoExports
    : GeneratorTaskResult<InferExportProviderMap<ExportMap>>;
}

export type ChildDescriptorOrReference = BaseGeneratorDescriptor | string;

export interface CreateGeneratorContext {
  id: string;
  logger: Logger;
}

export interface GeneratorBundle {
  scopes: ProviderExportScope[];
  children: Record<
    string,
    ChildDescriptorOrReference[] | ChildDescriptorOrReference | null
  >;
  tasks: GeneratorTask[];
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
