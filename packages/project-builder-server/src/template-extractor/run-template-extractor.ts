import type { SchemaParserContext } from '@baseplate-dev/project-builder-lib';
import type { Logger, TemplateFileExtractorCreator } from '@baseplate-dev/sync';

import { TsTemplateFileExtractor } from '@baseplate-dev/core-generators';
import {
  RawTemplateFileExtractor,
  runTemplateFileExtractors,
  TextTemplateFileExtractor,
} from '@baseplate-dev/sync';
import { findNearestPackageJson } from '@baseplate-dev/utils/node';
import { globby } from 'globby';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const GENERATOR_PACKAGES = [
  '@baseplate-dev/core-generators',
  '@baseplate-dev/fastify-generators',
  '@baseplate-dev/react-generators',
];

const TEMPLATE_FILE_EXTRACTOR_CREATORS: TemplateFileExtractorCreator[] = [
  (context) => new TextTemplateFileExtractor(context),
  (context) => new RawTemplateFileExtractor(context),
  (context) => new TsTemplateFileExtractor(context),
];

async function buildGeneratorPackageMap(
  context: SchemaParserContext,
): Promise<Map<string, string>> {
  const generatorPackageMap = new Map<string, string>();
  for (const plugin of context.pluginStore.availablePlugins) {
    const nearestPackageJsonPath = await findNearestPackageJson({
      cwd: plugin.metadata.pluginDirectory,
      stopAtNodeModules: true,
    });
    if (!nearestPackageJsonPath) {
      throw new Error(
        `Could not find package.json for ${plugin.metadata.packageName}`,
      );
    }
    generatorPackageMap.set(
      plugin.metadata.packageName,
      path.dirname(nearestPackageJsonPath),
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
  app: string,
  context: SchemaParserContext,
  logger: Logger,
): Promise<void> {
  // find all .generator-info.json files in the project
  const generatorInfoFiles = await globby(
    path.join('**', '.generator-info.json'),
    { onlyFiles: true, absolute: true, gitignore: true, cwd: directory },
  );
  const generatorPackageMap = await buildGeneratorPackageMap(context);
  logger.info(
    `Running template extractors for ${directory}${
      app ? ` for app ${app}` : ''
    }...`,
  );
  const appDirectories = generatorInfoFiles
    .map((generatorInfoPath) => path.dirname(generatorInfoPath))
    .filter((appDirectory) => {
      if (app) {
        return path.basename(appDirectory).includes(app);
      }
      return true;
    });
  if (appDirectories.length > 1) {
    throw new Error(
      `Found multiple app directories for ${app}: ${appDirectories.join(', ')}`,
    );
  }
  await runTemplateFileExtractors(
    TEMPLATE_FILE_EXTRACTOR_CREATORS,
    appDirectories[0],
    generatorPackageMap,
    logger,
  );
}
