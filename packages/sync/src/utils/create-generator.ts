import type { z } from 'zod';

import { statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type {
  GeneratorBundle,
  GeneratorTask,
} from '@src/generators/generators.js';
import type { ProviderExportScope } from '@src/providers/index.js';

import type { GeneratorTaskBuilder } from './create-generator-types.js';

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

    const tasks: GeneratorTask[] = [];
    const taskBuilder: GeneratorTaskBuilder = {
      generatorName: config.name,
      addTask: (task) => {
        tasks.push(task as GeneratorTask);
      },
    };
    config.buildTasks(taskBuilder, validatedDescriptor);

    return {
      name: config.name,
      directory: generatorDirectory,
      scopes: config.scopes ?? [],
      children: children ?? {},
      tasks,
    };
  };
}
