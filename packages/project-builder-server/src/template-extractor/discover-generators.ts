import type { PluginMetadataWithPaths } from '@baseplate-dev/project-builder-lib';
import type { Logger, TemplateConfig } from '@baseplate-dev/sync';

import { indexTemplateConfigs } from '@baseplate-dev/sync';
import { compareStrings } from '@baseplate-dev/utils';
import { findNearestPackageJson } from '@baseplate-dev/utils/node';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { discoverPlugins } from '#src/plugins/plugin-discovery.js';

const GENERATOR_PACKAGES = [
  '@baseplate-dev/core-generators',
  '@baseplate-dev/fastify-generators',
  '@baseplate-dev/react-generators',
];

export interface GeneratorInfo {
  name: string;
  packageName: string;
  packagePath: string;
  generatorDirectory: string;
  templates: Record<string, TemplateConfig>;
  templateCount: number;
}

/**
 * Build a map of generator package names to their file system paths
 */
export async function buildGeneratorPackageMap(
  availablePlugins: PluginMetadataWithPaths[],
): Promise<Map<string, string>> {
  const generatorPackageMap = new Map<string, string>();

  for (const plugin of availablePlugins) {
    const nearestPackageJsonPath = await findNearestPackageJson({
      cwd: plugin.pluginDirectory,
      stopAtNodeModules: true,
    });
    if (!nearestPackageJsonPath) {
      throw new Error(`Could not find package.json for ${plugin.packageName}`);
    }
    generatorPackageMap.set(
      plugin.packageName,
      path.dirname(nearestPackageJsonPath),
    );
  }

  // Attach built-in generator packages
  for (const packageName of GENERATOR_PACKAGES) {
    const nearestPackageJsonPath = await findNearestPackageJson({
      cwd: path.dirname(fileURLToPath(import.meta.resolve(packageName))),
      stopAtNodeModules: true,
    });
    if (!nearestPackageJsonPath) {
      throw new Error(`Could not find package.json for ${packageName}`);
    }
    generatorPackageMap.set(packageName, path.dirname(nearestPackageJsonPath));
  }

  return generatorPackageMap;
}

/**
 * Discover all available generators with extractor.json files
 */
export async function discoverGenerators(
  directory = process.cwd(),
  defaultPlugins: PluginMetadataWithPaths[],
  logger: Logger,
): Promise<GeneratorInfo[]> {
  const availablePlugins = await discoverPlugins(directory, logger);

  const generatorPackageMap = await buildGeneratorPackageMap([
    ...defaultPlugins,
    ...availablePlugins,
  ]);

  // Index all template configs using the unified utility
  const { extractorEntries } = await indexTemplateConfigs(generatorPackageMap);

  // Convert to GeneratorInfo format
  const generators: GeneratorInfo[] = extractorEntries.map((entry) => ({
    name: entry.generatorName,
    packageName: entry.packageName,
    packagePath: entry.packagePath,
    generatorDirectory: entry.generatorDirectory,
    templates: entry.config.templates,
    templateCount: Object.keys(entry.config.templates).length,
  }));

  // Sort generators by name for consistent output
  generators.sort((a, b) => compareStrings(a.name, b.name));

  return generators;
}
