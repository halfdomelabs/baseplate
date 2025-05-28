import type {
  ProjectDefinition,
  SchemaParserContext,
} from '@halfdomelabs/project-builder-lib';

import {
  createPluginImplementationStore,
  runPluginMigrations,
  runSchemaMigrations,
} from '@halfdomelabs/project-builder-lib';
import { CancelledSyncError, type Logger } from '@halfdomelabs/sync';
import {
  enhanceErrorWithContext,
  hashWithSHA256,
  stringifyPrettyStable,
} from '@halfdomelabs/utils';
import { fileExists } from '@halfdomelabs/utils/node';
import { mapValues } from 'es-toolkit';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { stripVTControlCharacters } from 'node:util';

import type { BaseplateUserConfig } from '#src/user-config/user-config-schema.js';

import { compileApplications } from '#src/compiler/index.js';

import type { PackageSyncResult, SyncStatus } from '../sync/index.js';
import type { SyncMetadataController } from './sync-metadata-controller.js';

import { generateForDirectory } from '../sync/index.js';
import { getPackageSyncStatusFromResult } from './utils.js';

async function loadProjectJson(
  directory: string,
  context: SchemaParserContext,
): Promise<{ definition: ProjectDefinition; hash: string }> {
  const projectJsonPath = path.join(
    directory,
    'baseplate/project-definition.json',
  );

  const projectJsonExists = await fileExists(projectJsonPath);

  if (!projectJsonExists) {
    throw new Error(`Could not find definition file at ${projectJsonPath}`);
  }

  try {
    const projectJsonContents = await readFile(projectJsonPath, 'utf8');
    const hash = await hashWithSHA256(projectJsonContents);

    const projectJson: unknown = JSON.parse(projectJsonContents);

    const { migratedDefinition, appliedMigrations } = runSchemaMigrations(
      projectJson as ProjectDefinition,
    );
    if (appliedMigrations.length > 0) {
      await writeFile(
        projectJsonPath,
        stringifyPrettyStable(migratedDefinition),
      );
    }

    const pluginImplementationStore = createPluginImplementationStore(
      context.pluginStore,
      migratedDefinition,
    );

    const definitionWithPluginMigrations = runPluginMigrations(
      migratedDefinition,
      pluginImplementationStore,
    );

    return { definition: definitionWithPluginMigrations, hash };
  } catch (err) {
    throw enhanceErrorWithContext(
      err,
      `Error parsing project definition at ${projectJsonPath}`,
    );
  }
}

/**
 * Options for building the project.
 */
export interface BuildProjectOptions {
  /**
   * The directory to build the project in.
   */
  directory: string;
  /**
   * The logger to use for logging.
   */
  logger: Logger;
  /**
   * The context to use for parsing the project.
   */
  context: SchemaParserContext;
  /**
   * The user config to use for building the project.
   */
  userConfig: BaseplateUserConfig;
  /**
   * The sync metadata controller to use for updating metadata about the sync process.
   */
  syncMetadataController?: SyncMetadataController;
  /**
   * Abort signal to use for cancelling the sync.
   */
  abortSignal?: AbortSignal;
  /**
   * Whether to skip running commands.
   */
  skipCommands?: boolean;
}

/**
 * The result of building the project.
 */
export interface BuildProjectResult {
  /**
   * The status of the build.
   */
  status: SyncStatus;
}

/**
 * Builds the project in the given directory.
 *
 * @param options - The options for building the project.
 */
export async function buildProject({
  directory,
  logger,
  context,
  userConfig,
  syncMetadataController,
  abortSignal,
  skipCommands,
}: BuildProjectOptions): Promise<BuildProjectResult> {
  await syncMetadataController?.updateMetadata((metadata) => ({
    ...metadata,
    status: 'in-progress',
    globalErrors: undefined,
    startedAt: new Date().toISOString(),
    // retain the packages of the previous sync initially
    packages: mapValues(metadata.packages, (packageInfo) => ({
      ...packageInfo,
      status: 'not-synced',
    })),
  }));

  try {
    const { definition: projectJson } = await loadProjectJson(
      directory,
      context,
    );
    const apps = compileApplications(projectJson, context);

    await syncMetadataController?.updateMetadata((metadata) => ({
      ...metadata,
      status: 'in-progress',
      startedAt: new Date().toISOString(),
      packages: Object.fromEntries(
        apps.map((app, index) => [
          app.id,
          {
            name: app.name,
            path: path.join(directory, app.appDirectory),
            status: 'not-synced',
            statusMessage: undefined,
            order: index,
            // Keep the result from the previous sync if it exists so we can
            // keep any errored commands from the previous sync.
            result:
              app.id in metadata.packages
                ? metadata.packages[app.id].result
                : undefined,
          },
        ]),
      ),
    }));

    let hasErrors = false;
    let wasCancelled = false;

    for (const app of apps) {
      let newResult: PackageSyncResult;
      try {
        if (abortSignal?.aborted) {
          break;
        }

        await syncMetadataController?.updateMetadataForPackage(
          app.id,
          (metadata) => ({ ...metadata, status: 'in-progress' }),
        );
        const metadata = await syncMetadataController?.getMetadata();
        const packageInfo = metadata?.packages[app.id];

        const fileIdRegexWhitelist =
          projectJson.templateExtractor?.fileIdRegexWhitelist.split('\n') ?? [];

        newResult = await generateForDirectory({
          baseDirectory: directory,
          appEntry: app,
          logger,
          writeTemplateMetadataOptions: projectJson.templateExtractor
            ?.writeMetadata
            ? {
                includeTemplateMetadata: true,
                shouldGenerateMetadata: (context) => {
                  // always write metadata for files without a manual ID
                  if (!context.hasManualId) return true;
                  return fileIdRegexWhitelist
                    .filter((x) => x.trim() !== '')
                    .some((pattern) => {
                      const regex = new RegExp(pattern);
                      return regex.test(
                        `${context.generatorName}:${context.fileId}`,
                      );
                    });
                },
              }
            : undefined,
          userConfig,
          previousPackageSyncResult: packageInfo?.result,
          abortSignal,
          skipCommands,
        });
      } catch (err) {
        if (err instanceof CancelledSyncError) {
          newResult = {
            wasCancelled: true,
            completedAt: new Date().toISOString(),
          };
          wasCancelled = true;
        } else {
          logger.error(`Encountered error while generating for ${app.name}:`);
          logger.error(err);

          newResult = {
            errors: [
              {
                // stripVTControlCharacters is used to remove any control characters from the error message
                // which can happen when prettier encounters an error.
                message: stripVTControlCharacters(
                  err instanceof Error ? err.message : String(err),
                ),
                stack: err instanceof Error ? err.stack : undefined,
              },
            ],
            completedAt: new Date().toISOString(),
          };

          hasErrors = true;
        }
      }
      await syncMetadataController?.updateMetadataForPackage(
        app.id,
        (metadata) => ({
          ...metadata,
          status: getPackageSyncStatusFromResult(newResult),
          statusMessage: undefined,
          result: newResult,
        }),
      );
    }

    const status = wasCancelled ? 'cancelled' : hasErrors ? 'error' : 'success';

    await syncMetadataController?.updateMetadata((metadata) => ({
      ...metadata,
      status,
      completedAt: new Date().toISOString(),
    }));

    if (wasCancelled) {
      logger.info('Project build cancelled.');
    } else if (hasErrors) {
      logger.error('Project build failed.');
    } else {
      logger.info(`Project written to ${directory}!`);
    }

    return { status };
  } catch (err) {
    await syncMetadataController?.updateMetadata((metadata) => ({
      ...metadata,
      status: 'error',
      completedAt: new Date().toISOString(),
      globalErrors: [String(err)],
    }));
    logger.error('Project build failed.');
    throw err;
  }
}
