import { stringifyPrettyCompact } from '@baseplate-dev/utils';
import path from 'node:path';

import type { TemplateExtractorContext } from '../runner/template-extractor-context.js';

/**
 * Writes extractor.json files for the specified generators to the file system.
 * This function reads the current configurations from the context and writes them
 * to their respective extractor.json files.
 *
 * @param generatorNames - Array of generator names to write extractor.json files for
 * @param context - Template extractor context containing config lookup and file container
 * @throws Error if no config is found for a generator
 */
export async function writeExtractorTemplateJsons(
  generatorNames: string[],
  context: TemplateExtractorContext,
): Promise<void> {
  for (const generator of generatorNames) {
    const generatorConfig = context.configLookup.getExtractorConfig(generator);
    if (!generatorConfig) {
      throw new Error(`No 'extractor.json' found for generator: ${generator}`);
    }

    // Write the config to the extractor.json file
    await context.fileContainer.writeFile(
      path.join(generatorConfig.generatorDirectory, 'extractor.json'),
      stringifyPrettyCompact(generatorConfig.config),
    );
  }
}
