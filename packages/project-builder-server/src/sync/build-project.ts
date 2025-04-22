import type {
  ProjectDefinition,
  SchemaParserContext,
} from '@halfdomelabs/project-builder-lib';

import { runSchemaMigrations } from '@halfdomelabs/project-builder-lib';
import { type Logger } from '@halfdomelabs/sync';
import { hashWithSHA256, stringifyPrettyStable } from '@halfdomelabs/utils';
import { fileExists } from '@halfdomelabs/utils/node';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import type { BaseplateUserConfig } from '@src/user-config/user-config-schema.js';

import { compileApplications } from '@src/compiler/index.js';

import type { PackageSyncResult, PackageSyncStatus } from '../sync/index.js';
import type { SyncMetadataController } from './sync-controller.js';

import { generateForDirectory } from '../sync/index.js';

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
}

function getPackageSyncStatusFromResult(
  result: PackageSyncResult,
): PackageSyncStatus {
  if (result.errors?.length) {
    return 'unknown-error';
  }

  if (result.filesWithConflicts?.length || result.filesPendingDelete?.length) {
    return 'conflicts';
  }

  if (result.failedCommands?.length) {
    return 'command-error';
  }

  return 'success';
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
}: BuildProjectOptions): Promise<void> {
  const { definition: projectJson, hash } = await loadProjectJson(directory);
  const apps = compileApplications(projectJson, context);

  const existingSyncMetadata = await syncMetadataController?.getMetadata();

  syncMetadataController?.writeMetadata({
    packages: Object.fromEntries(
      apps.map((app) => [
        app.id,
        {
          name: app.name,
          path: app.appDirectory,
          status: 'not-synced',
          statusMessage: undefined,
          result: undefined,
        },
      ]),
    ),
  });

  let hasErrors = false;

  for (const app of apps) {
    const previousPackageSyncResult =
      existingSyncMetadata?.packages[app.id].result;
    let newResult: PackageSyncResult;
    try {
      newResult = await generateForDirectory({
        baseDirectory: directory,
        appEntry: app,
        logger,
        shouldWriteTemplateMetadata:
          projectJson.templateExtractor?.writeMetadata,
        userConfig,
        previousPackageSyncResult,
      });
    } catch (err) {
      logger.error(`Encountered error while generating for ${app.name}:`);
      logger.error(err);

      newResult = {
        errors: [
          {
            message: String(err),
            stack: err instanceof Error ? err.stack : undefined,
          },
        ],
      };

      hasErrors = true;
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
    lastSyncResult: {
      status: hasErrors ? 'error' : 'success',
      timestamp: new Date().toISOString(),
      projectJsonHash: hash,
    },
  }));

  if (hasErrors) {
    logger.error('Project build failed');
  } else {
    logger.info(`Project written to ${directory}!`);
  }
}
