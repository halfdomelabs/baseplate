import type { z } from 'zod';

import { mapValues } from 'es-toolkit';
import { statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type {
  GeneratorBundle,
  GeneratorTask,
} from '@src/generators/generators.js';
import type { Provider, ProviderExportScope } from '@src/providers/index.js';

import type {
  GeneratorTaskBuilder,
  SimpleGeneratorTaskConfig,
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

export type GeneratorBundleChildren = Record<
  string,
  GeneratorBundle | GeneratorBundle[] | undefined
>;

/**
 * A function that given a descriptor returns the generator bundle
 *
 * @param descriptor - The descriptor to create a generator from
 * @param options - Optional options to pass to the generator such as children
 * @returns The generator bundle
 */
export type GeneratorBundleCreator<Descriptor> = (
  descriptorWithChildren: Omit<Descriptor, 'children'> & {
    children?: GeneratorBundleChildren;
  },
) => GeneratorBundle;

/**
 * Infer the descriptor from a generator bundle creator
 */
export type InferDescriptorFromGenerator<Creator> =
  Creator extends GeneratorBundleCreator<infer Descriptor>
    ? Omit<Descriptor, 'children'> & {
        children?: GeneratorBundleChildren;
      }
    : never;

/**
 * Helper utility to create a generator with a standard format for customizable children
 *
 * @param config Configuration of the generator
 * @returns A function that given a descriptor returns the generator bundle
 */
export function createGenerator<DescriptorSchema extends z.ZodType>(
  config: CreateGeneratorConfig<DescriptorSchema>,
): GeneratorBundleCreator<z.input<DescriptorSchema>> {
  const generatorFilePath = fileURLToPath(config.generatorFileUrl);
  const generatorDirectory = statSync(generatorFilePath).isFile()
    ? path.dirname(generatorFilePath)
    : generatorFilePath;

  return ({ children, ...rest }) => {
    const validatedDescriptor =
      (config.descriptorSchema?.parse(rest) as unknown) ?? {};

    const taskConfigs: SimpleGeneratorTaskConfig[] = [];
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
    config.buildTasks(taskBuilder, validatedDescriptor);

    const tasks: GeneratorTask[] = taskConfigs.map((task) => {
      const taskDependencies = task.taskDependencies ?? {};
      return {
        name: task.name,
        dependencies: task.dependencies,
        exports: task.exports,
        outputs: task.outputs,
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
            providers: runResult.providers,
            async build(builder) {
              if (!runResult.build) {
                return {};
              }
              let taskOutput: unknown;
              const output = await Promise.resolve(
                runResult.build(builder, (output) => {
                  taskOutput = output;
                }),
              );
              taskOutputs[task.name] = taskOutput;
              return output as Record<string, Provider>;
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
