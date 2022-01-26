import { promises as fs } from 'fs';
import path from 'path';
import R from 'ramda';
import { getModuleDefault, resolveModule } from '../utils/require';
import { GeneratorConfig } from './generator';

export interface GeneratorConfigWithLocation extends GeneratorConfig {
  /**
   * The root directory of the generator
   */
  configBaseDirectory: string;
}

export type GeneratorConfigMap = Record<string, GeneratorConfigWithLocation>;

export async function loadGeneratorsForModule(
  module: string
): Promise<GeneratorConfigMap> {
  const modulePath = resolveModule(module);
  const generatorsDirectory = path.join(modulePath, '../generators');

  const dirs = await fs.readdir(generatorsDirectory, { withFileTypes: true });
  const generatorFolders = dirs
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  const generators = generatorFolders.map((folder) => {
    const generatorFolder = path.join(generatorsDirectory, folder);
    const generator = getModuleDefault<GeneratorConfig>(generatorFolder);
    if (!generator) {
      throw new Error(
        `Generator folder has no default export: ${generatorFolder}`
      );
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
    const name = `${module.replace(/-generators$/, '')}/${folder}`;

    return {
      [name]: {
        ...generator,
        configBaseDirectory: generatorFolder,
      },
    };
  });
  return R.mergeAll(generators);
}
