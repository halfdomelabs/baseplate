import { globby } from 'globby';
import fsAdapter from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { packageUp } from 'package-up';
import { z } from 'zod';

import { pathExists, readJsonWithSchema } from '@src/utils/fs.js';
import { loadDefaultExport } from '@src/utils/load-default-export.js';

import type { GeneratorConfig } from './generators.js';

export interface GeneratorConfigEntry {
  /**
   * The configuration of the generator
   */
  config: GeneratorConfig;
  /**
   * The directory of the generator
   */
  directory: string;
}

export type GeneratorConfigMap = Record<
  string,
  GeneratorConfigEntry | undefined
>;

// Generator modules have the ability to add a generator.json to the root to specify
// where the loader should look for generators
const loaderConfigSchema = z.object({
  // the base directory to look for generators, defaults to the dist/generators folder
  generatorBaseDirectory: z.string().default('dist/generators'),
  // glob patterns to match generators
  generatorPatterns: z.array(z.string()).default(['*']),
});

/**
 * Loads the generators in a given package
 *
 * @param packageName The name of the package
 * @param packagePath The path to the package
 * @returns The generator config entries for the package
 */
export async function loadGeneratorsForPackage(
  packageName: string,
  packagePath: string,
): Promise<GeneratorConfigMap | undefined> {
  // look for a generator.json in the root of the module
  const loaderConfigPath = path.join(packagePath, 'generator.json');
  const loaderConfigExists = await pathExists(loaderConfigPath);
  if (!loaderConfigExists) {
    return undefined;
  }
  const loaderConfig = await readJsonWithSchema(
    loaderConfigPath,
    loaderConfigSchema,
  );

  const baseDirectory = path.join(
    packagePath,
    loaderConfig.generatorBaseDirectory,
  );

  const candidateDirectories = await globby(loaderConfig.generatorPatterns, {
    cwd: baseDirectory,
    onlyDirectories: true,
    absolute: true,
    fs: fsAdapter,
  });

  const generatorPairs = await Promise.all(
    candidateDirectories
      .filter((folder) => !path.basename(folder).startsWith('_'))
      .map(async (folder) => {
        const generator = (await loadDefaultExport(folder)) as
          | GeneratorConfig
          | undefined;
        if (!generator) {
          return;
        }
        if (
          !('parseDescriptor' in generator) ||
          typeof generator.parseDescriptor !== 'function'
        ) {
          throw new Error(
            `Generator config lacks a parseDescriptor function: ${folder}`,
          );
        }
        if (
          !('createGenerator' in generator) ||
          typeof generator.createGenerator !== 'function'
        ) {
          throw new Error(
            `Generator config lacks a createGenerator function: ${folder}`,
          );
        }
        const name = `${packageName.replace(/-generators$/, '')}/${path.relative(baseDirectory, folder).replaceAll(path.sep, path.posix.sep)}`;

        return [name, { config: generator, directory: folder }] as const;
      }),
  );

  return Object.fromEntries(generatorPairs.filter((x) => x !== undefined));
}

export async function loadGeneratorsForPackages(
  modulePaths: Record<string, string>,
): Promise<GeneratorConfigMap> {
  const generatorMaps = await Promise.all(
    Object.entries(modulePaths).map(([moduleName, modulePath]) =>
      loadGeneratorsForPackage(moduleName, modulePath),
    ),
  );

  return Object.fromEntries(
    generatorMaps.filter(Boolean).flatMap((map) => Object.entries(map ?? {})),
  );
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
    ? await readJsonWithSchema(pluginConfigPath, appPluginConfigSchema)
    : undefined;

  // attempt to resolve all plugin paths
  const require = createRequire(projectDirectory);

  const generatorPackagePaths = { ...builtInGeneratorPaths };

  if (pluginConfig?.plugins) {
    await Promise.all(
      pluginConfig.plugins.map(async (plugin): Promise<void> => {
        if (!generatorPackagePaths[plugin.name]) {
          const pluginIndex = require.resolve(plugin.name);
          const pluginPath = await packageUp({
            cwd: path.dirname(pluginIndex),
          });
          if (pluginPath) {
            generatorPackagePaths[plugin.name] = path.dirname(pluginPath);
          }
        }
      }),
    );
  }

  return loadGeneratorsForPackages(generatorPackagePaths);
}
