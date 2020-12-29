/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */

import path from 'path';
import { promises as fs } from 'fs';
import R from 'ramda';
import { GeneratorConfig } from './generator';

export async function loadGenerators(
  module: string
): Promise<{
  [name: string]: GeneratorConfig<any>;
}> {
  const modulePath = require.resolve(module);
  const GENERATOR_DIR = path.join(modulePath, '../generators');
  const dirs = await fs.readdir(GENERATOR_DIR, { withFileTypes: true });
  const generatorFolders = dirs
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  const generators = generatorFolders.map((folder) => {
    const generatorFolder = path.join(GENERATOR_DIR, folder);
    const generator = require(generatorFolder)?.default as GeneratorConfig<any>;
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
    const name = `${module.replace('-generators', '')}/${folder}`;
    // attach location
    generator.baseDirectory = generator.baseDirectory || generatorFolder;
    return { [name]: generator };
  });
  return R.mergeAll(generators);
}
