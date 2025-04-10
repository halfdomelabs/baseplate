import { stringifyPrettyStable } from '@halfdomelabs/utils';
import { findNearestPackageJson } from '@halfdomelabs/utils/node';
import { promises as fs } from 'node:fs';
import path from 'node:path';

import type { GeneratorEntry } from '@src/generators/build-generator-entry.js';
import type { FileData } from '@src/output/generator-task-output.js';

import { GENERATOR_INFO_FILENAME } from '../constants.js';

async function buildGeneratorInfoMapRecursive(
  entry: GeneratorEntry,
  map: Map<string, string>,
  generatorsWithMetadata: Set<string>,
): Promise<void> {
  // set current generator info
  const generatorName = entry.generatorInfo.name;
  if (!map.has(generatorName) && generatorsWithMetadata.has(generatorName)) {
    const packageJsonPath = await findNearestPackageJson({
      cwd: entry.generatorInfo.baseDirectory,
    });
    if (!packageJsonPath) {
      throw new Error(
        `No package.json found for generator at ${entry.generatorInfo.baseDirectory}`,
      );
    }
    map.set(
      generatorName,
      path
        .relative(
          path.dirname(packageJsonPath),
          entry.generatorInfo.baseDirectory,
        )
        .replaceAll('\\', '/')
        // make sure we point to the src folder not the dist folder
        .replace(/^dist\//, 'src/'),
    );
  }
  // recurse into children
  for (const child of entry.children) {
    await buildGeneratorInfoMapRecursive(child, map, generatorsWithMetadata);
  }
}

/**
 * Writes the generator metadata map to the project root that
 * contains the information about the generators that were used to generate the project
 *
 * @param generatorEntry - The generator bundle that was used to generate the project
 * @param files - Map of file paths to file data
 * @param outputDirectory - Base directory where files are being written
 * @returns Promise that resolves when all metadata files are written
 */
export async function writeGeneratorsMetadata(
  entry: GeneratorEntry,
  files: Map<string, FileData>,
  outputDirectory: string,
): Promise<void> {
  const generatorsWithMetadata = new Set<string>(
    [...files.values()]
      .map((f) => f.options?.templateMetadata?.generator)
      .filter((g) => g !== undefined),
  );
  const generatorInfoMap = new Map<string, string>();
  await buildGeneratorInfoMapRecursive(
    entry,
    generatorInfoMap,
    generatorsWithMetadata,
  );

  await fs.writeFile(
    path.join(outputDirectory, GENERATOR_INFO_FILENAME),
    stringifyPrettyStable(Object.fromEntries(generatorInfoMap.entries())),
    'utf8',
  );
}
