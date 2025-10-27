import type { SchemaParserContext } from '@baseplate-dev/project-builder-lib';
import type { Logger } from '@baseplate-dev/sync';

import {
  buildGeneratorEntry,
  executeGeneratorEntry,
  formatGeneratorOutput,
  loadIgnorePatterns,
} from '@baseplate-dev/sync';
import path from 'node:path';

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
   * The app to create a snapshot for.
   */
  app: string;
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
   * Custom snapshot directory name.
   */
  snapshotDir?: string;
}

/**
 * Creates a snapshot of the current diff state for a particular app
 */
export async function createSnapshotForProject(
  options: CreateSnapshotForProjectOptions,
): Promise<void> {
  const {
    projectDirectory: directory,
    app: appName,
    logger,
    context,
    useIgnoreFile = true,
    snapshotDir,
  } = options;

  try {
    logger.info('Loading project definition...');
    const { definition: projectJson } = await loadProjectDefinition(
      directory,
      context,
    );

    logger.info('Compiling applications...');
    const apps = compilePackages(projectJson, context);

    // Filter apps if specified
    const app = apps.find((app) => appName === app.name);

    if (!app) {
      throw new Error(
        `No applications found named ${appName}. Available apps: ${apps.map((a) => a.name).join(', ')}`,
      );
    }

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
    const result = await saveSnapshot(appDirectory, formattedGeneratorOutput, {
      snapshotDir,
      ignoreInstance,
    });

    logger.info(
      `✓ Snapshot created at ${result.snapshotPath} (${result.fileCount.modified} modified, ${result.fileCount.added} added, ${result.fileCount.deleted} deleted)`,
    );

    logger.info('✓ Snapshots created successfully');
  } catch (error) {
    logger.error(`Error creating snapshot: ${String(error)}`);
    throw error;
  }
}
