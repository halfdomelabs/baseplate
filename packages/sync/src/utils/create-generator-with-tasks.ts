import type { z } from 'zod';

import * as R from 'ramda';

import type {
  BaseGeneratorDescriptor,
  GeneratorConfig,
  GeneratorOutputBuilder,
  InferDependencyProviderMap,
  InferExportProviderMap,
  Provider,
  ProviderDependencyMap,
  ProviderExportMap,
  ProviderExportScope,
} from '../core/index.js';
import type {
  ChildGeneratorConfig,
  DescriptorWithChildren,
} from './create-generator-types.js';

import { baseDescriptorSchema } from '../core/index.js';
import { notEmpty } from './arrays.js';

export interface SimpleGeneratorTaskOutput<TaskOutput = void> {
  name: string;
  getOutput: () => TaskOutput;
}

interface SimpleGeneratorTaskInstance<
  ExportMap extends Record<string, unknown> = Record<string, Provider>,
  TaskOutput = unknown,
> {
  getProviders?: () => ExportMap;
  build?: (builder: GeneratorOutputBuilder) => Promise<TaskOutput> | TaskOutput;
}

type TaskOutputDependencyMap<T = Record<string, unknown>> = {
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

export interface GeneratorWithTasksConfig<DescriptorSchema extends z.ZodType> {
  descriptorSchema?: DescriptorSchema;
  getDefaultChildGenerators?(
    descriptor: z.infer<DescriptorSchema>,
  ): Partial<Record<string, ChildGeneratorConfig>>;
  scopes?: ProviderExportScope[];
  buildTasks: (
    taskBuilder: GeneratorTaskBuilder,
    descriptor: DescriptorWithChildren & z.infer<DescriptorSchema>,
  ) => void;
}

/**
 * Helper utility to create a generator with a standard format for customizable children
 *
 * getDefaultChildGenerators will return a map of valid child generators
 * Consumers can customize children via the children property in the descriptor.
 * They can prefix the key with a $ to add custom children that aren't specified in the config.
 *
 * @param config Configuration of the generator
 * @returns Normal generator
 */
export function createGeneratorWithTasks<
  DescriptorSchema extends z.SomeZodObject,
>(
  config: GeneratorWithTasksConfig<DescriptorSchema>,
): GeneratorConfig<DescriptorWithChildren & z.infer<DescriptorSchema>> {
  return {
    scopes: config.scopes,
    parseDescriptor: (descriptor: DescriptorWithChildren, context) => {
      try {
        // TODO: Merge with base descriptor
        const mergedSchema = config.descriptorSchema?.and(baseDescriptorSchema);
        const validatedDescriptor = mergedSchema?.parse(
          descriptor,
        ) as DescriptorWithChildren & z.infer<DescriptorSchema>;
        const { id } = context;
        const childGeneratorConfigs =
          config.getDefaultChildGenerators?.(descriptor) ?? {};

        // make sure descriptor children match context
        const descriptorChildren = descriptor.children ?? {};
        const invalidChild = Object.keys(descriptorChildren)
          .filter((key) => !key.startsWith('$'))
          .find((key) => !childGeneratorConfigs[key]);
        if (invalidChild) {
          throw new Error(
            `Unknown child found in descriptor: ${invalidChild} (in ${id}). Prefix key with $ if custom child`,
          );
        }

        const mergeAndValidateDescriptor = (
          { defaultDescriptor, defaultToNullIfEmpty }: ChildGeneratorConfig,
          descriptorChild:
            | Partial<BaseGeneratorDescriptor>
            | string
            | undefined
            | null,
        ): BaseGeneratorDescriptor | string | null => {
          if (typeof descriptorChild === 'string') {
            // child references are not parsed currently
            // TODO: Figure out better solution?
            return descriptorChild;
          }

          // if neither default descriptor nor descriptor child is provided, assume null
          // if no descriptor child and we've been told to default to null, return null
          // if descriptor child is null, assume it's been explicitly removed
          if (
            (!defaultDescriptor && !descriptorChild) ||
            (!descriptorChild && !!defaultToNullIfEmpty) ||
            descriptorChild === null
          ) {
            return null;
          }

          const mergedDescriptor = R.mergeRight(
            defaultDescriptor ?? {},
            descriptorChild ?? {},
          );

          const validatedChildDescriptor = baseDescriptorSchema
            .passthrough()
            .parse(mergedDescriptor);

          // TODO: Need to implement provider

          return validatedChildDescriptor;
        };

        const children = R.mapObjIndexed((value, key) => {
          if (!value) {
            return null;
          }
          const { isMultiple } = value;

          if (isMultiple) {
            const childArray = descriptorChildren[key] ?? [];
            if (!Array.isArray(childArray)) {
              throw new TypeError(
                `${id} has invalid child ${key}. Must be array.`,
              );
            }
            return childArray
              .map((childDescriptor) =>
                mergeAndValidateDescriptor(value, childDescriptor),
              )
              .filter(notEmpty);
          }
          const child = descriptorChildren[key];

          if (Array.isArray(child)) {
            throw new TypeError(
              `${id} has invalid child ${key}. Cannot be array.`,
            );
          }
          return mergeAndValidateDescriptor(value, child);
        }, childGeneratorConfigs);

        const customChildren: Record<string, BaseGeneratorDescriptor | string> =
          R.pickBy((_, key) => key.startsWith('$'), descriptorChildren);

        return {
          children: R.mergeRight(children, customChildren),
          validatedDescriptor,
        };
      } catch (error) {
        context.logger.error(
          `Descriptor validation failed at ${context.id}: ${
            (error as Error).message
          }`,
        );
        throw error;
      }
    },
    createGenerator: (descriptor) => {
      const tasks: SimpleGeneratorTaskConfig<
        ProviderExportMap,
        ProviderDependencyMap,
        TaskOutputDependencyMap
      >[] = [];
      const taskOutputs: Record<string, unknown> = {};
      const taskBuilder: GeneratorTaskBuilder<
        DescriptorWithChildren & z.infer<DescriptorSchema>
      > = {
        addTask: (task) => {
          tasks.push(task instanceof Function ? task(descriptor) : task);
          return {
            name: task.name,
            getOutput: () => {
              if (!(task.name in taskOutputs)) {
                throw new Error(`Task ${task.name} has not run yet`);
              }
              // no easy way of typing this
              // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-explicit-any
              return taskOutputs[task.name] as any;
            },
          };
        },
      };
      config.buildTasks(taskBuilder, descriptor);

      return tasks.map((task) => {
        const taskDependencies = task.taskDependencies ?? {};
        return {
          name: task.name,
          dependencies: task.dependencies,
          exports: task.exports,
          taskDependencies: Object.values(taskDependencies).map(
            (dep) => dep.name,
          ),
          run(dependencies) {
            const resolvedTaskOutputs = R.mapObjIndexed(
              (obj) => obj.getOutput(),
              taskDependencies,
            );
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- task.run may return undefined
            const runResult = task.run(dependencies, resolvedTaskOutputs) ?? {};
            return {
              getProviders: runResult.getProviders,
              async build(builder) {
                if (!runResult.build) {
                  return;
                }
                const taskOutput = await Promise.resolve(
                  runResult.build(builder),
                );
                taskOutputs[task.name] = taskOutput;
              },
            };
          },
        };
      });
    },
  };
}
