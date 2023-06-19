import path from 'path';
import fs from 'fs-extra';
import globby from 'globby';
import R from 'ramda';
import { z } from 'zod';
import { getModuleDefault } from '../utils/require';
import { GeneratorConfig } from './generator';

export interface GeneratorConfigWithLocation extends GeneratorConfig {
  /**
   * The root directory of the generator
   */
  configBaseDirectory: string;
}

export type GeneratorConfigMap = Record<string, GeneratorConfigWithLocation>;

// Generator modules have the ability to add a generator.json to the root to specify
// where the loader should look for generators
const GENERATOR_LOADER_CONFIG_SCHEMA = z.object({
  // the base directory to look for generators, defaults to the dist/generators folder
  generatorBaseDirectory: z.string().default('dist/generators'),
  // glob patterns to match generators
  generatorPatterns: z.array(z.string()).default(['*']),
});

export async function loadGeneratorsForModule(
  moduleName: string,
  modulePath: string
): Promise<GeneratorConfigMap> {
  // look for a generator.json in the root of the module
  const moduleConfigPath = path.join(modulePath, 'generator.json');
  const moduleConfigExists = await fs.pathExists(moduleConfigPath);
  const generatorLoaderConfig = moduleConfigExists
    ? ((await fs.readJSON(moduleConfigPath)) as unknown)
    : {};

  const validatedConfig = GENERATOR_LOADER_CONFIG_SCHEMA.parse(
    generatorLoaderConfig
  );

  const generatorsDirectory = path.join(
    modulePath,
    validatedConfig.generatorBaseDirectory
  );

  const matchedGenerators = await globby(validatedConfig.generatorPatterns, {
    cwd: generatorsDirectory,
    onlyDirectories: true,
  });

  const generators = matchedGenerators
    .filter((folder) => !path.basename(folder).startsWith('_'))
    .map((folder) => {
      const generatorFolder = path.join(generatorsDirectory, folder);
      const generator = getModuleDefault<GeneratorConfig>(generatorFolder);
      if (!generator) {
        // assume there is no generator
        return {};
      }
      if (!generator.createGenerator) {
        throw new Error(
          `Generator function lacks a createGenerator function: ${generatorFolder}`
        );
      }
      if (!generator.parseDescriptor) {
        throw new Error(
          `Generator function lacks a parseDescriptor function: ${generatorFolder}`
        );
      }
      const name = `${moduleName.replace(/-generators$/, '')}/${folder}`;

      return {
        [name]: {
          ...generator,
          configBaseDirectory: generatorFolder,
        },
      };
    });
  return R.mergeAll(generators);
}
