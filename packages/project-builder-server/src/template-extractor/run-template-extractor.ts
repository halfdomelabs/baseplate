import type { SchemaParserContext } from '@halfdomelabs/project-builder-lib';
import type { Logger, TemplateFileExtractorCreator } from '@halfdomelabs/sync';

import {
  RawTemplateFileExtractor,
  runTemplateFileExtractors,
  TextTemplateFileExtractor,
} from '@halfdomelabs/sync';
import { findNearestPackageJson } from '@halfdomelabs/utils/node';
import { globby } from 'globby';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const GENERATOR_PACKAGES = [
  '@halfdomelabs/core-generators',
  '@halfdomelabs/fastify-generators',
  '@halfdomelabs/react-generators',
];

const TEMPLATE_FILE_EXTRACTOR_CREATORS: TemplateFileExtractorCreator[] = [
  (context) => new TextTemplateFileExtractor(context),
  (context) => new RawTemplateFileExtractor(context),
];

async function buildGeneratorPackageMap(
  context: SchemaParserContext,
): Promise<Map<string, string>> {
  const generatorPackageMap = new Map<string, string>();
  for (const plugin of context.pluginStore.availablePlugins) {
    generatorPackageMap.set(
      plugin.metadata.packageName,
      plugin.metadata.pluginDirectory,
    );
  }
  // attach generator packages
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

export async function runTemplateExtractorsForProject(
  directory: string,
  context: SchemaParserContext,
  logger: Logger,
): Promise<void> {
  // find all .generator-info.json files in the project
  const generatorInfoFiles = await globby(
    path.join(directory, '**', '.generator-info.json'),
    { onlyFiles: true, absolute: true },
  );
  const generatorPackageMap = await buildGeneratorPackageMap(context);
  logger.info(`Running template extractors for ${directory}...`);
  const appDirectories = generatorInfoFiles.map((generatorInfoPath) =>
    path.dirname(generatorInfoPath),
  );
  await runTemplateFileExtractors(
    TEMPLATE_FILE_EXTRACTOR_CREATORS,
    appDirectories,
    generatorPackageMap,
    logger,
  );
}
