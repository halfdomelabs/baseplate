import type { GeneratorBundle } from '@src/generators/generators.js';
import type { GeneratorOutput } from '@src/output/generator-task-output.js';
import type { Logger } from '@src/utils/evented-logger.js';

import {
  buildGeneratorEntry,
  type GeneratorEntry,
} from '@src/generators/build-generator-entry.js';

import type {
  GeneratorWriteOptions,
  GeneratorWriteResult,
} from '../output/write-generator-output.js';

import { writeGeneratorOutput } from '../output/write-generator-output.js';
import { executeGeneratorEntry } from '../runner/index.js';

/**
 * The engine for loading generators and executing them.
 */
export class GeneratorEngine {
  /**
   * Loads the root generator entry from a generator bundle.
   *
   * @param bundle - The generator bundle.
   * @param logger - The logger to use.
   */
  loadProject(
    bundle: GeneratorBundle,
    logger: Logger = console,
  ): GeneratorEntry {
    return buildGeneratorEntry(bundle, {
      logger,
    });
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
