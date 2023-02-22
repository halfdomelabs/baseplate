import path from 'path';
import { Logger } from '@src/utils/evented-logger';
import { GeneratorOutput } from '../generator-output';
import {
  GeneratorWriteOptions,
  GeneratorWriteResult,
  writeGeneratorOutput,
} from '../generator-output-writer';
import { GeneratorConfigMap } from '../loader';
import { loadDescriptorFromFile } from './descriptor-loader';
import { buildGeneratorEntry, GeneratorEntry } from './generator-builder';
import { executeGeneratorEntry } from './generator-runner';

export class GeneratorEngine {
  generators: GeneratorConfigMap = {};

  constructor(generators: GeneratorConfigMap) {
    this.generators = generators;
  }

  /**
   * Loads the root descriptor of a project
   *
   * @param directory Directory of project to load
   */
  async loadProject(
    directory: string,
    logger: Logger = console
  ): Promise<GeneratorEntry> {
    const projectPath = path.join(directory, 'baseplate');
    const rootDescriptor = await loadDescriptorFromFile(
      path.join(projectPath, 'root')
    );
    const rootGeneratorEntry = await buildGeneratorEntry(
      rootDescriptor,
      'root',
      { baseDirectory: projectPath, generatorMap: this.generators, logger }
    );

    return rootGeneratorEntry;
  }

  async build(
    rootEntry: GeneratorEntry,
    logger: Logger = console
  ): Promise<GeneratorOutput> {
    return executeGeneratorEntry(rootEntry, logger);
  }

  async writeOutput(
    output: GeneratorOutput,
    outputDirectory: string,
    options?: GeneratorWriteOptions,
    logger: Logger = console
  ): Promise<GeneratorWriteResult> {
    return writeGeneratorOutput(output, outputDirectory, options, logger);
  }
}
