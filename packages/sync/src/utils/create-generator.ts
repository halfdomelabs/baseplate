import type { z } from 'zod';

import { statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type {
  AnyGeneratorTask,
  GeneratorBundle,
} from '@src/generators/generators.js';
import type { TaskPhase } from '@src/phases/types.js';
import type { ProviderExportScope } from '@src/providers/index.js';

/**
 * Configuration for creating a generator
 */
interface CreateGeneratorConfig<
  DescriptorSchema extends z.ZodType,
  TaskConfigs extends Record<string, AnyGeneratorTask | undefined>,
> {
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
   * The scopes that the generator encompasses
   */
  scopes?: ProviderExportScope[];
  /**
   * The phases that should be pre-registered since they
   * only contain dynamic tasks
   */
  preRegisteredPhases?: TaskPhase[];
  /**
   * The function to get the instance name of the generator
   *
   * This is required if the generator is in a list of generators
   */
  getInstanceName?: (descriptor: z.infer<DescriptorSchema>) => string;
  /**
   * The function to build the tasks
   */
  buildTasks: (descriptor: z.infer<DescriptorSchema>) => TaskConfigs;
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
type GeneratorBundleCreator<
  Descriptor,
  TaskConfigs extends Record<string, AnyGeneratorTask | undefined> = Record<
    string,
    AnyGeneratorTask | undefined
  >,
> = (
  descriptorWithChildren: Omit<Descriptor, 'children'> & {
    children?: GeneratorBundleChildren;
  },
) => GeneratorBundle<TaskConfigs>;

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
export function createGenerator<
  DescriptorSchema extends z.ZodType,
  TaskConfigs extends Record<string, AnyGeneratorTask | undefined>,
>(
  config: CreateGeneratorConfig<DescriptorSchema, TaskConfigs>,
): GeneratorBundleCreator<z.input<DescriptorSchema>, TaskConfigs> {
  const generatorFilePath = fileURLToPath(config.generatorFileUrl);
  const generatorDirectory = statSync(generatorFilePath).isFile()
    ? path.dirname(generatorFilePath)
    : generatorFilePath;

  return ({ children, ...rest }) => {
    const validatedDescriptor =
      (config.descriptorSchema?.parse(rest) as unknown) ?? {};

    const tasks = config.buildTasks(validatedDescriptor);

    return {
      name: config.name,
      instanceName: config.getInstanceName?.(validatedDescriptor),
      directory: generatorDirectory,
      scopes: config.scopes ?? [],
      children: children ?? {},
      tasks,
      preRegisteredPhases: config.preRegisteredPhases ?? [],
    };
  };
}
