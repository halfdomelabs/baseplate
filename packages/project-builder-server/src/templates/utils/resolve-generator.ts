import type { PluginMetadataWithPaths } from '@baseplate-dev/project-builder-lib';
import type { Logger } from '@baseplate-dev/sync';

import { findClosestMatch } from '@baseplate-dev/utils';

import { discoverGenerators } from '../../template-extractor/discover-generators.js';

/**
 * Resolves a generator name to its directory path using the template discovery system
 * @throws Error if the generator is not found or if discovery fails
 */
export async function resolveGenerator(
  projectDirectory: string,
  plugins: PluginMetadataWithPaths[],
  generatorName: string,
  logger: Logger,
): Promise<string> {
  try {
    // Use the existing generator discovery to find all available generators
    const generators = await discoverGenerators(
      projectDirectory,
      plugins,
      logger,
    );

    const generator = generators.find((gen) => gen.name === generatorName);

    if (!generator) {
      const availableGenerators = generators.map((g) => g.name);
      const closestGenerators = findClosestMatch(
        generatorName,
        availableGenerators,
        3,
      );
      throw new Error(
        `Generator '${generatorName}' not found. Did you mean one of these: ${closestGenerators.join(', ')}?`,
      );
    }

    return generator.generatorDirectory;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(
      `Failed to resolve generator '${generatorName}': ${String(error)}`,
    );
  }
}
