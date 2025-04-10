import {
  handleFileNotFoundError,
  readJsonWithSchema,
} from '@halfdomelabs/utils/node';
import path from 'node:path';
import { z } from 'zod';

import type { TemplateFileExtractorGeneratorInfo } from './template-file-extractor.js';

import { GENERATOR_INFO_FILENAME } from '../constants.js';

const generatorInfoSchema = z.record(z.string());

/**
 * Creates a map of generator names to info about the generator.
 *
 * @param outputDirectory - The output directory.
 * @param generatorPackageMap - A map of generator packages to the base directory of the package.
 * @returns A map of generator names to info about the generator.
 */
export async function createGeneratorInfoMap(
  outputDirectory: string,
  generatorPackageMap: Map<string, string>,
): Promise<Map<string, TemplateFileExtractorGeneratorInfo>> {
  const generatorInfoMetadata = await readJsonWithSchema(
    path.join(outputDirectory, GENERATOR_INFO_FILENAME),
    generatorInfoSchema,
  ).catch(handleFileNotFoundError);

  if (!generatorInfoMetadata) {
    throw new Error(
      `Could not find ${GENERATOR_INFO_FILENAME} file in ${outputDirectory}.
         Please run a generation first with metadata writing enabled.`,
    );
  }

  const generatorInfoMap = new Map(
    Object.entries(generatorInfoMetadata).map(
      ([generatorName, generatorPackageRelativePath]) => {
        if (!generatorName.includes('#')) {
          throw new Error(
            `Generator name ${generatorName} is not in the correct format.
             Please use the format <package-name>#<generator-name>.`,
          );
        }
        const packageName = generatorName.split('#')[0];
        const packagePath = generatorPackageMap.get(packageName);
        if (!packagePath) {
          throw new Error(
            `Could not find location of the generator package for ${generatorName}`,
          );
        }
        return [
          generatorName,
          {
            name: generatorName,
            baseDirectory: path.join(packagePath, generatorPackageRelativePath),
          },
        ];
      },
    ),
  );
  return generatorInfoMap;
}
