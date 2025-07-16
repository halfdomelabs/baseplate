import type {
  ProjectDefinition,
  SchemaParserContext,
} from '@baseplate-dev/project-builder-lib';
import type { Logger } from '@baseplate-dev/sync';

import {
  createPluginImplementationStore,
  runPluginMigrations,
  runSchemaMigrations,
} from '@baseplate-dev/project-builder-lib';
import { CancelledSyncError } from '@baseplate-dev/sync';
import {
  enhanceErrorWithContext,
  hashWithSHA256,
  stringifyPrettyStable,
} from '@baseplate-dev/utils';
import { fileExists } from '@baseplate-dev/utils/node';
import { mapValues } from 'es-toolkit';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { stripVTControlCharacters } from 'node:util';

import type { BaseplateUserConfig } from '#src/user-config/user-config-schema.js';

import { compileApplications } from '#src/compiler/index.js';

import type { PackageSyncResult, SyncStatus } from '../sync/index.js';
import type { SyncMetadataController } from './sync-metadata-controller.js';

import { generateForDirectory } from '../sync/generate-for-directory.js';
import { createTemplateMetadataOptions } from './template-metadata-utils.js';
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
 * Options for syncing the project.
 */
export interface SyncProjectOptions {
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
  /**
   * The path to the CLI file that was executed to start the sync.
   * This is used by the VSCode extension to find the command to trigger additional commands.
   */
  cliFilePath?: string;
  /**
   * Whether to force overwrite existing files without merge conflict detection.
   */
  forceOverwrite?: boolean;
}

/**
 * The result of syncing the project.
 */
export interface SyncProjectResult {
  /**
   * The status of the sync.
   */
  status: SyncStatus;
}

/**
 * Syncs the project in the given directory.
 *
 * @param options - The options for syncing the project.
 */
export async function syncProject({
  directory,
  logger,
  context,
  userConfig,
  syncMetadataController,
  abortSignal,
  skipCommands,
  cliFilePath,
  forceOverwrite,
}: SyncProjectOptions): Promise<SyncProjectResult> {
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
      // Set cliFilePath only if template extraction is enabled
      cliFilePath:
        projectJson.settings.templateExtractor?.writeMetadata && cliFilePath
          ? cliFilePath
          : undefined,
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

        newResult = await generateForDirectory({
          baseDirectory: directory,
          appEntry: app,
          logger,
          writeTemplateMetadataOptions:
            createTemplateMetadataOptions(projectJson),
          userConfig,
          previousPackageSyncResult: packageInfo?.result,
          abortSignal,
          skipCommands,
          forceOverwrite,
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
      logger.info('Project sync cancelled.');
    } else if (hasErrors) {
      logger.error('Project sync failed.');
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
    logger.error('Project sync failed.');
    throw err;
  }
}
