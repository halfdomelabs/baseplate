import { globby } from 'globby';
import fsAdapter from 'node:fs';
import { writeFile } from 'node:fs/promises';
import path from 'node:path/posix';

import { parseGeneratorName } from '../../../utils/parse-generator-name.js';

export interface TryCreateExtractorJsonOptions {
  packageMap: Map<string, string>;
  generatorName: string;
}

/**
 * Attempts to create an extractor.json file for a generator if it doesn't exist.
 *
 * This function searches for a generator file matching the pattern:
 * `generatorPath/generatorBasename.generator.ts`
 *
 * If exactly one matching file is found, creates an extractor.json file
 * in the same directory with the generator name.
 *
 * @param options - Configuration for creating the extractor.json
 * @throws {Error} If no generator file is found or multiple files match
 * @throws {Error} If the generator name cannot be parsed
 */
export async function tryCreateExtractorJson(
  options: TryCreateExtractorJsonOptions,
): Promise<void> {
  const { packageMap, generatorName } = options;

  const parsedGenerator = parseGeneratorName(generatorName);
  const { generatorPath, generatorBasename, packageName } = parsedGenerator;

  // Search for generator files matching the pattern
  const searchPattern = path.join(
    '**',
    `${generatorPath}/${generatorBasename}.generator.ts`,
  );

  const packagePath = packageMap.get(packageName);

  if (!packagePath) {
    throw new Error(
      `Package ${packageName} not found in package map. Please ensure it has been registered with the project builder.`,
    );
  }

  const matchingFiles = await globby([searchPattern], {
    cwd: packagePath,
    absolute: true,
    onlyFiles: true,
    fs: fsAdapter,
    gitignore: true,
  });

  if (matchingFiles.length === 0) {
    throw new Error(
      `No generator file found matching pattern: ${generatorPath}/${generatorBasename}.generator.ts`,
    );
  }

  if (matchingFiles.length > 1) {
    throw new Error(
      `Multiple generator files found matching pattern: ${generatorPath}/${generatorBasename}.generator.ts. Found: ${matchingFiles.join(', ')}`,
    );
  }

  const generatorFile = matchingFiles[0];
  const generatorDirectory = path.dirname(generatorFile);
  const extractorJsonPath = path.join(generatorDirectory, 'extractor.json');

  // Create the extractor.json content
  const extractorConfig = {
    name: generatorPath,
  };

  await writeFile(
    extractorJsonPath,
    `${JSON.stringify(extractorConfig, null, 2)}\n`,
    'utf8',
  );
}
