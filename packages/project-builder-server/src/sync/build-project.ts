import type {
  ProjectDefinition,
  SchemaParserContext,
} from '@halfdomelabs/project-builder-lib';

import { runSchemaMigrations } from '@halfdomelabs/project-builder-lib';
import { CancelledSyncError, type Logger } from '@halfdomelabs/sync';
import { hashWithSHA256, stringifyPrettyStable } from '@halfdomelabs/utils';
import { fileExists } from '@halfdomelabs/utils/node';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { stripVTControlCharacters } from 'node:util';

import type { BaseplateUserConfig } from '@src/user-config/user-config-schema.js';

import { compileApplications } from '@src/compiler/index.js';

import type { PackageSyncResult } from '../sync/index.js';
import type { SyncMetadataController } from './sync-metadata-controller.js';

import { generateForDirectory } from '../sync/index.js';
import { getPackageSyncStatusFromResult } from './utils.js';

async function loadProjectJson(
  directory: string,
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

    return { definition: migratedDefinition, hash };
  } catch (err) {
    throw new Error(
      `Error parsing project definition at ${projectJsonPath}: ${String(err)}`,
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
}: BuildProjectOptions): Promise<void> {
  const { definition: projectJson, hash } = await loadProjectJson(directory);
  const apps = compileApplications(projectJson, context);

  const existingSyncMetadata = await syncMetadataController?.getMetadata();

  syncMetadataController?.writeMetadata({
    status: 'in-progress',
    startedAt: new Date().toISOString(),
    projectJsonHash: hash,
    packages: Object.fromEntries(
      apps.map((app, index) => [
        app.id,
        {
          name: app.name,
          path: path.join(directory, app.appDirectory),
          status: 'not-synced',
          statusMessage: undefined,
          result: undefined,
          order: index,
        },
      ]),
    ),
  });

  let hasErrors = false;
  let wasCancelled = false;

  for (const app of apps) {
    const previousPackageSyncResult =
      existingSyncMetadata?.packages[app.id].result;
    let newResult: PackageSyncResult;
    try {
      if (abortSignal?.aborted) {
        break;
      }

      syncMetadataController?.updateMetadataForPackage(app.id, (metadata) => ({
        ...metadata,
        status: 'in-progress',
      }));

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
                return fileIdRegexWhitelist.some((pattern) => {
                  const regex = new RegExp(pattern);
                  return regex.test(context.fileId);
                });
              },
            }
          : undefined,
        userConfig,
        previousPackageSyncResult,
        abortSignal,
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
              message: stripVTControlCharacters(String(err)),
              stack: err instanceof Error ? err.stack : undefined,
            },
          ],
          completedAt: new Date().toISOString(),
        };

        hasErrors = true;
      }
    }
    syncMetadataController?.updateMetadataForPackage(app.id, (metadata) => ({
      ...metadata,
      status: getPackageSyncStatusFromResult(newResult),
      statusMessage: undefined,
      result: newResult,
    }));
  }

  syncMetadataController?.updateMetadata((metadata) => ({
    ...metadata,
    status: wasCancelled ? 'cancelled' : hasErrors ? 'error' : 'success',
    completedAt: new Date().toISOString(),
  }));

  if (wasCancelled) {
    logger.info('Project build cancelled.');
  } else if (hasErrors) {
    logger.error('Project build failed.');
  } else {
    logger.info(`Project written to ${directory}!`);
  }
}
