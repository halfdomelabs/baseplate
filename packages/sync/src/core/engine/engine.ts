import path from 'node:path';

import type { Logger } from '@src/utils/evented-logger.js';

import type {
  GeneratorWriteOptions,
  GeneratorWriteResult,
} from '../generator-output-writer.js';
import type { GeneratorOutput } from '../generator-output.js';
import type { GeneratorEntry } from './generator-builder.js';

import { writeGeneratorOutput } from '../generator-output-writer.js';
import {
  loadGeneratorsForModules,
  loadGeneratorsForProject,
} from '../loader.js';
import { loadDescriptorFromFile } from './descriptor-loader.js';
import { buildGeneratorEntry } from './generator-builder.js';
import { executeGeneratorEntry } from './generator-runner.js';

export class GeneratorEngine {
  constructor(public builtInGeneratorModulePaths: Record<string, string>) {}

  async preloadGenerators(): Promise<void> {
    // Preload all generators for faster generations
    await loadGeneratorsForModules(this.builtInGeneratorModulePaths);
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
    const rootDescriptor = await loadDescriptorFromFile(
      path.join(projectPath, 'root'),
    );
    const generators = await loadGeneratorsForProject(
      this.builtInGeneratorModulePaths,
      directory,
    );

    const rootGeneratorEntry = await buildGeneratorEntry(
      rootDescriptor,
      'root',
      { baseDirectory: projectPath, generatorMap: generators, logger },
    );

    return rootGeneratorEntry;
  }

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
