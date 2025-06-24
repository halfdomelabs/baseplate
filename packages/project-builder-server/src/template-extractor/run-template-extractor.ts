import type { PluginMetadataWithPaths } from '@baseplate-dev/project-builder-lib';
import type {
  Logger,
  RunTemplateFileExtractorsOptions,
} from '@baseplate-dev/sync';

import {
  RawTemplateFileExtractor,
  TextTemplateFileExtractor,
  TsTemplateFileExtractor,
} from '@baseplate-dev/core-generators/extractors';
import { runTemplateFileExtractors } from '@baseplate-dev/sync';

import { discoverPlugins } from '#src/plugins/plugin-discovery.js';
import { getPreviousGeneratedFileIdMap } from '#src/sync/file-id-map.js';
import { readSyncMetadata } from '#src/sync/sync-metadata-service.js';

import { buildGeneratorPackageMap } from './discover-generators.js';

const TEMPLATE_EXTRACTORS = [
  RawTemplateFileExtractor,
  TextTemplateFileExtractor,
  TsTemplateFileExtractor,
];

export async function runTemplateExtractorsForProject(
  directory: string,
  app: string,
  defaultPlugins: PluginMetadataWithPaths[],
  logger: Logger,
  options?: RunTemplateFileExtractorsOptions,
): Promise<void> {
  const availablePlugins = await discoverPlugins(directory, logger);
  const syncMetadata = await readSyncMetadata(directory);

  if (
    syncMetadata.status === 'not-started' ||
    Object.keys(syncMetadata.packages).length === 0
  ) {
    throw new Error(
      `No sync metadata found for ${directory}. Please run the sync command first.`,
    );
  }

  const generatorPackageMap = await buildGeneratorPackageMap([
    ...defaultPlugins,
    ...availablePlugins,
  ]);
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
