import path from 'path';
import { GeneratorOutput } from '../generator-output';
import { writeGeneratorOutput } from '../generator-output-writer';
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
  async loadProject(directory: string): Promise<GeneratorEntry> {
    const projectPath = path.join(directory, 'baseplate');
    const rootDescriptor = await loadDescriptorFromFile(
      path.join(projectPath, 'root')
    );
    const rootGeneratorEntry = await buildGeneratorEntry(
      rootDescriptor,
      'root',
      { baseDirectory: projectPath, generatorMap: this.generators }
    );

    return rootGeneratorEntry;
  }

  async build(rootEntry: GeneratorEntry): Promise<GeneratorOutput> {
    return executeGeneratorEntry(rootEntry);
  }

  async writeOutput(
    output: GeneratorOutput,
    outputDirectory: string,
    cleanDirectory?: string
  ): Promise<void> {
    await writeGeneratorOutput(output, outputDirectory, cleanDirectory);
  }
}
