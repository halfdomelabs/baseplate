import type { SchemaParserContext } from '@baseplate-dev/project-builder-lib';
import type { Logger } from '@baseplate-dev/sync';
import type { RunTemplateFileExtractorsOptions } from '@baseplate-dev/sync/extractor-v2';

import {
  RawTemplateFileExtractor,
  TextTemplateFileExtractor,
} from '@baseplate-dev/core-generators';
import { TsTemplateFileExtractor } from '@baseplate-dev/core-generators/extractor-v2';
import { runTemplateFileExtractors } from '@baseplate-dev/sync/extractor-v2';
import { findNearestPackageJson } from '@baseplate-dev/utils/node';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { getPreviousGeneratedFileIdMap } from '#src/sync/file-id-map.js';
import { readSyncMetadata } from '#src/sync/sync-metadata-service.js';

const GENERATOR_PACKAGES = [
  '@baseplate-dev/core-generators',
  '@baseplate-dev/fastify-generators',
  '@baseplate-dev/react-generators',
];

const TEMPLATE_EXTRACTORS = [
  RawTemplateFileExtractor,
  TextTemplateFileExtractor,
  TsTemplateFileExtractor,
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

export async function runTemplateExtractorsForProjectV2(
  directory: string,
  app: string,
  context: SchemaParserContext,
  logger: Logger,
  options?: RunTemplateFileExtractorsOptions,
): Promise<void> {
  const syncMetadata = await readSyncMetadata(directory);

  if (
    syncMetadata.status === 'not-started' ||
    Object.keys(syncMetadata.packages).length === 0
  ) {
    throw new Error(
      `No sync metadata found for ${directory}. Please run the sync command first.`,
    );
  }

  const generatorPackageMap = await buildGeneratorPackageMap(context);
  logger.info(
    `Running template extractors for ${directory}${
      app ? ` for app ${app}` : ''
    }...`,
  );
  const appDirectories = Object.values(syncMetadata.packages)
    .filter((packageInfo) => packageInfo.name.includes(app))
    .map((packageInfo) => packageInfo.path);
  if (appDirectories.length === 0) {
    throw new Error(`No app directories found for ${app}`);
  }
  if (appDirectories.length > 1) {
    throw new Error(
      `Found multiple app directories for ${app}: ${appDirectories.join(', ')}`,
    );
  }
  const fileIdMap = await getPreviousGeneratedFileIdMap(appDirectories[0]);
  await runTemplateFileExtractors(
    TEMPLATE_EXTRACTORS,
    appDirectories[0],
    generatorPackageMap,
    logger,
    fileIdMap,
    options,
  );
  logger.info('Template extraction complete!');
}
