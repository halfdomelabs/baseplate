import type {
  ProjectDefinition,
  SchemaParserContext,
} from '@baseplate-dev/project-builder-lib';
import type { Logger } from '@baseplate-dev/sync';

import {
  buildGeneratorEntry,
  executeGeneratorEntry,
  formatGeneratorOutput,
  loadIgnorePatterns,
} from '@baseplate-dev/sync';
import path from 'node:path';

import type { PackageEntry } from '#src/compiler/package-entry.js';
import type { BaseplateUserConfig } from '#src/user-config/user-config-schema.js';

import { compilePackages } from '#src/compiler/index.js';
import { loadProjectDefinition } from '#src/project-definition/index.js';
import { createTemplateMetadataOptions } from '#src/sync/template-metadata-utils.js';

import { saveSnapshot } from './save-snapshot.js';

/**
 * Options for creating snapshots
 */
export interface CreateSnapshotForProjectOptions {
  /**
   * The directory to create snapshot in.
   */
  projectDirectory: string;
  /**
   * The app to create a snapshot for. If omitted, saves snapshots for all apps.
   */
  app?: string;
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
   * Whether to use .baseplateignore file for filtering.
   */
  useIgnoreFile?: boolean;
  /**
   * Custom baseplate directory. Defaults to `path.join(projectDirectory, 'baseplate')`.
   */
  baseplateDirectory?: string;
  /**
   * When true, store full content of added files in the snapshot.
   * Use for test cases where files aren't committed. Default: false.
   */
  includeAddedFileContents?: boolean;
}

interface CreateSnapshotForAppOptions {
  app: PackageEntry;
  directory: string;
  projectJson: ProjectDefinition;
  logger: Logger;
  useIgnoreFile: boolean;
  baseplateDirectory?: string;
  includeAddedFileContents?: boolean;
}

/**
 * Creates a snapshot for a single app entry.
 */
async function createSnapshotForApp({
  app,
  directory,
  projectJson,
  logger,
  useIgnoreFile,
  baseplateDirectory,
  includeAddedFileContents,
}: CreateSnapshotForAppOptions): Promise<void> {
  const appDirectory = path.join(directory, app.packageDirectory);

  logger.info(
    `Creating snapshot for app: ${app.name} (${app.packageDirectory})`,
  );

  // Load ignore patterns for this app directory
  const ignoreInstance = useIgnoreFile
    ? await loadIgnorePatterns(appDirectory)
    : undefined;

  // Generate the output without writing files
  const generatorEntry = await buildGeneratorEntry(app.generatorBundle);
  const generatorOutput = await executeGeneratorEntry(generatorEntry, {
    templateMetadataOptions: createTemplateMetadataOptions(projectJson),
  });

  // Format the output
  const formattedGeneratorOutput = await formatGeneratorOutput(
    generatorOutput,
    { outputDirectory: appDirectory },
  );

  // Create snapshot
  const result = await saveSnapshot(
    appDirectory,
    directory,
    app.name,
    formattedGeneratorOutput,
    {
      baseplateDirectory,
      ignoreInstance,
      includeAddedFileContents,
    },
  );

  logger.info(
    `✓ Snapshot created at ${result.snapshotPath} (${result.fileCount.modified} modified, ${result.fileCount.added} added, ${result.fileCount.deleted} deleted)`,
  );
}

/**
 * Creates snapshots for one or all apps in a project.
 * Returns the list of app names that were processed.
 */
export async function createSnapshotForProject(
  options: CreateSnapshotForProjectOptions,
): Promise<string[]> {
  const {
    projectDirectory: directory,
    app: appName,
    logger,
    context,
    useIgnoreFile = true,
    baseplateDirectory,
    includeAddedFileContents,
  } = options;

  try {
    logger.info('Loading project definition...');
    const { definition: projectJson } = await loadProjectDefinition(
      directory,
      context,
      baseplateDirectory,
    );

    logger.info('Compiling applications...');
    const apps = compilePackages(projectJson, context);

    let appsToProcess: PackageEntry[];

    if (appName) {
      const app = apps.find((a) => appName === a.name);
      if (!app) {
        throw new Error(
          `No applications found named ${appName}. Available apps: ${apps.map((a) => a.name).join(', ')}`,
        );
      }
      appsToProcess = [app];
    } else {
      appsToProcess = apps;
    }

    const savedApps: string[] = [];

    for (const app of appsToProcess) {
      await createSnapshotForApp({
        app,
        directory,
        projectJson,
        logger,
        useIgnoreFile,
        baseplateDirectory,
        includeAddedFileContents,
      });
      savedApps.push(app.name);
    }

    logger.info('✓ Snapshots created successfully');
    return savedApps;
  } catch (error) {
    logger.error(`Error creating snapshot: ${String(error)}`);
    throw error;
  }
}
