import multimatch from 'multimatch';
import { createRequire } from 'node:module';
import path from 'node:path';
import { packageUp } from 'package-up';
import * as R from 'ramda';
import { z } from 'zod';

import { notEmpty } from '@src/utils/arrays.js';
import { listDirectories, pathExists, readJSON } from '@src/utils/fs.js';

import type { GeneratorConfig } from './generator.js';

import { getModuleDefault } from '../utils/require.js';

export interface GeneratorConfigWithLocation extends GeneratorConfig {
  /**
   * The root directory of the generator
   */
  configBaseDirectory: string;
}

export type GeneratorConfigMap = Record<
  string,
  GeneratorConfigWithLocation | undefined
>;

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
  modulePath: string,
): Promise<GeneratorConfigMap | null> {
  // look for a generator.json in the root of the module
  const moduleConfigPath = path.join(modulePath, 'generator.json');
  const moduleConfigExists = await pathExists(moduleConfigPath);
  if (!moduleConfigExists) {
    return null;
  }
  const generatorLoaderConfig = await readJSON(moduleConfigPath);

  const validatedConfig = GENERATOR_LOADER_CONFIG_SCHEMA.parse(
    generatorLoaderConfig,
  );

  const generatorsDirectory = path.join(
    modulePath,
    validatedConfig.generatorBaseDirectory,
  );

  const possibleDirectories = await listDirectories(generatorsDirectory);
  const matchedGenerators = multimatch(
    possibleDirectories.map((directory) =>
      directory.slice(generatorsDirectory.length + 1),
    ),
    validatedConfig.generatorPatterns,
  );

  const generators = await Promise.all(
    matchedGenerators
      .filter((folder) => !path.basename(folder).startsWith('_'))
      .map(async (folder) => {
        const generatorFolder = path.join(generatorsDirectory, folder);
        const generator =
          await getModuleDefault<GeneratorConfig>(generatorFolder);
        if (!generator) {
          // assume there is no generator
          return {};
        }
        if (!('createGenerator' in generator)) {
          throw new Error(
            `Generator function lacks a createGenerator function: ${generatorFolder}`,
          );
        }
        if (!('parseDescriptor' in generator)) {
          throw new Error(
            `Generator function lacks a parseDescriptor function: ${generatorFolder}`,
          );
        }
        const name = `${moduleName.replace(/-generators$/, '')}/${folder.replaceAll(path.sep, path.posix.sep)}`;

        return {
          [name]: {
            ...generator,
            configBaseDirectory: generatorFolder,
          },
        };
      }),
  );

  return R.mergeAll(generators);
}

export function loadGeneratorsForModules(
  modulePaths: Record<string, string>,
): Promise<GeneratorConfigMap> {
  return Promise.all(
    Object.entries(modulePaths).map(([moduleName, modulePath]) =>
      loadGeneratorsForModule(moduleName, modulePath),
    ),
  ).then((generators) => R.mergeAll(generators.filter(notEmpty)));
}

export const appPluginConfigSchema = z.object({
  plugins: z
    .array(
      z.object({
        name: z.string(),
      }),
    )
    .optional(),
});

export type AppPluginConfig = z.infer<typeof appPluginConfigSchema>;

export async function loadGeneratorsForProject(
  builtInGeneratorPaths: Record<string, string>,
  projectDirectory: string,
): Promise<GeneratorConfigMap> {
  const pluginConfigPath = path.join(
    projectDirectory,
    'baseplate/plugins.json',
  );
  const pluginConfigExists = await pathExists(pluginConfigPath);

  const pluginConfig = pluginConfigExists
    ? appPluginConfigSchema.parse(await readJSON(pluginConfigPath))
    : undefined;

  // attempt to resolve all plugin paths
  const require = createRequire(projectDirectory);

  const generatorModulePaths = { ...builtInGeneratorPaths };

  if (pluginConfig?.plugins) {
    await Promise.all(
      pluginConfig.plugins.map(async (plugin): Promise<void> => {
        if (!generatorModulePaths[plugin.name]) {
          const pluginIndex = require.resolve(plugin.name);
          const pluginPath = await packageUp({
            cwd: path.dirname(pluginIndex),
          });
          if (pluginPath) {
            generatorModulePaths[plugin.name] = path.dirname(pluginPath);
          }
        }
      }),
    );
  }

  return loadGeneratorsForModules(generatorModulePaths);
}
