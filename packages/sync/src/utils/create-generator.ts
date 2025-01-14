import type { z } from 'zod';

import { mapValues } from 'es-toolkit';
import { statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type {
  GeneratorBundle,
  GeneratorTask,
  ProviderDependencyMap,
  ProviderExportMap,
} from '@src/generators/generators.js';
import type { ProviderExportScope } from '@src/providers/index.js';

import type {
  GeneratorTaskBuilder,
  SimpleGeneratorTaskConfig,
  TaskOutputDependencyMap,
} from './create-generator-types.js';

/**
 * Configuration for creating a generator
 */
export interface CreateGeneratorConfig<DescriptorSchema extends z.ZodType> {
  /**
   * The name of the generator
   */
  name: string;
  /**
   * The file URL of the generator that is a sibling to the templates directory
   *
   * Usually passing `import.meta.url` should be the best option.
   */
  generatorFileUrl: string;
  /**
   * The schema for the descriptor
   */
  descriptorSchema?: DescriptorSchema;
  /**
   * The scopes to export
   */
  scopes?: ProviderExportScope[];
  /**
   * The function to build the tasks
   */
  buildTasks: (
    taskBuilder: GeneratorTaskBuilder,
    descriptor: z.infer<DescriptorSchema>,
  ) => void;
}

/**
 * A function that given a descriptor returns the generator bundle
 *
 * @param descriptor - The descriptor to create a generator from
 * @param options - Optional options to pass to the generator such as children
 * @returns The generator bundle
 */
export type GeneratorBundleCreator<Descriptor> = (
  descriptor: Descriptor,
  options?: {
    children?: Record<string, GeneratorBundle | GeneratorBundle[] | undefined>;
  },
) => GeneratorBundle;

/**
 * Helper utility to create a generator with a standard format for customizable children
 *
 * @param config Configuration of the generator
 * @returns A function that given a descriptor returns the generator bundle
 */
export function createGenerator<DescriptorSchema extends z.ZodType>(
  config: CreateGeneratorConfig<DescriptorSchema>,
): GeneratorBundleCreator<z.infer<DescriptorSchema>> {
  const generatorFilePath = fileURLToPath(config.generatorFileUrl);
  const generatorDirectory = statSync(generatorFilePath).isFile()
    ? path.dirname(generatorFilePath)
    : generatorFilePath;

  return (descriptor, { children } = {}) => {
    const validatedDescriptor =
      (config.descriptorSchema?.parse(descriptor) as unknown) ?? {};

    const taskConfigs: SimpleGeneratorTaskConfig<
      ProviderExportMap,
      ProviderDependencyMap,
      TaskOutputDependencyMap
    >[] = [];
    const taskOutputs: Record<string, unknown> = {};
    const taskBuilder: GeneratorTaskBuilder<z.infer<DescriptorSchema>> = {
      addTask: (task) => {
        taskConfigs.push(
          task instanceof Function ? task(validatedDescriptor) : task,
        );
        return {
          name: task.name,
          getOutput: () => {
            if (!(task.name in taskOutputs)) {
              throw new Error(`Task ${task.name} has not run yet`);
            }
            // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-explicit-any -- taskOutputs is typed as Record<string, unknown>
            return taskOutputs[task.name] as any;
          },
        };
      },
    };
    config.buildTasks(taskBuilder, descriptor);

    const tasks: GeneratorTask<ProviderExportMap, ProviderDependencyMap>[] =
      taskConfigs.map((task) => {
        const taskDependencies = task.taskDependencies ?? {};
        return {
          name: task.name,
          dependencies: task.dependencies,
          exports: task.exports,
          taskDependencies: Object.values(taskDependencies).map(
            (dep) => dep.name,
          ),
          run(dependencies) {
            const resolvedTaskOutputs = mapValues(taskDependencies, (dep) =>
              dep.getOutput(),
            );
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- it can return undefined if there are no exports
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

    return {
      name: config.name,
      directory: generatorDirectory,
      scopes: config.scopes ?? [],
      children: children ?? {},
      tasks,
    };
  };
}
