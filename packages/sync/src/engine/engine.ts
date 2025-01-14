import path from 'node:path';

import type { GeneratorEntry } from '@src/generators/build-generator-entry.js';
import type { GeneratorOutput } from '@src/output/generator-task-output.js';
import type { Logger } from '@src/utils/evented-logger.js';

import { baseDescriptorSchema } from '@src/generators/generators.js';
import { readJsonWithSchema } from '@src/utils/fs.js';

import type {
  GeneratorWriteOptions,
  GeneratorWriteResult,
} from '../output/write-generator-output.js';

import { buildGeneratorEntryFromDescriptor } from '../generators/entry-builder.js';
import {
  loadGeneratorsForPackages,
  loadGeneratorsForProject,
} from '../generators/loader.js';
import { writeGeneratorOutput } from '../output/write-generator-output.js';
import { executeGeneratorEntry } from '../runner/index.js';

/**
 * The engine for loading generators and executing them.
 */
export class GeneratorEngine {
  /**
   * @param builtInGeneratorModulePaths - The paths to the built-in generator modules.
   */
  constructor(public builtInGeneratorModulePaths: Record<string, string>) {}

  /**
   * Preloads all generators for faster generations.
   */
  async preloadGenerators(): Promise<void> {
    await loadGeneratorsForPackages(this.builtInGeneratorModulePaths);
  }

  /**
   * Loads the root descriptor of a project
   *
   * @param directory Directory of project to load
   */
  async loadProject(
    directory: string,
    logger: Logger = console,
  ): Promise<GeneratorEntry> {
    const projectPath = path.join(directory, 'baseplate');
    const rootDescriptor = await readJsonWithSchema(
      path.join(projectPath, 'root.json'),
      baseDescriptorSchema.passthrough(),
    );
    const generators = await loadGeneratorsForProject(
      this.builtInGeneratorModulePaths,
      directory,
    );

    const rootGeneratorEntry = await buildGeneratorEntryFromDescriptor(
      rootDescriptor,
      'root',
      { baseDirectory: projectPath, generatorMap: generators, logger },
    );

    return rootGeneratorEntry;
  }

  /**
   * Builds the root generator entry.
   *
   * @param rootEntry - The root generator entry.
   * @param logger - The logger to use.
   */
  async build(
    rootEntry: GeneratorEntry,
    logger: Logger = console,
  ): Promise<GeneratorOutput> {
    return executeGeneratorEntry(rootEntry, logger);
  }

  async writeOutput(
    output: GeneratorOutput,
    outputDirectory: string,
    options?: GeneratorWriteOptions,
    logger: Logger = console,
  ): Promise<GeneratorWriteResult> {
    return writeGeneratorOutput(output, outputDirectory, options, logger);
  }
}
