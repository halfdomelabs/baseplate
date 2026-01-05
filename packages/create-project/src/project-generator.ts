import type {
  PluginStore,
  ProjectDefinition,
  SchemaParserContext,
} from '@baseplate-dev/project-builder-lib';

import { getLatestMigrationVersion } from '@baseplate-dev/project-builder-lib';
import {
  generateProjectId,
  SyncMetadataController,
  syncProject,
} from '@baseplate-dev/project-builder-server';
import { createConsoleLogger } from '@baseplate-dev/sync';
import { stringifyPrettyStable } from '@baseplate-dev/utils';
import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Configuration for generating an initial project.
 */
interface InitialProjectConfig {
  /**
   * The name of the project (used in package.json and project definition).
   */
  name: string;
  /**
   * The CLI version to use for the project.
   */
  cliVersion: string;
  /**
   * The absolute path to the project directory.
   */
  directory: string;
}

/**
 * Creates a placeholder project definition with isInitialized: false.
 * This definition can be used to bootstrap a new Baseplate project.
 *
 * @param config - Configuration for the initial project
 * @returns A ProjectDefinition with isInitialized: false
 */
export function createInitialProjectDefinition(
  config: InitialProjectConfig,
): ProjectDefinition {
  return {
    settings: {
      general: {
        name: config.name,
        packageScope: '',
        portOffset: 3000,
      },
    },
    features: [],
    cliVersion: config.cliVersion,
    apps: [],
    packages: [],
    models: [],
    isInitialized: false,
    schemaVersion: getLatestMigrationVersion(),
  };
}

/**
 * Generates the root package files using the Baseplate sync engine.
 * This creates all standard root-level files (package.json, turbo.json, etc.)
 * and writes the project definition to baseplate/project-definition.json.
 *
 * @param config - Configuration for the initial project
 */
export async function generateRootPackage(
  config: InitialProjectConfig,
): Promise<void> {
  const definition = createInitialProjectDefinition(config);
  const logger = createConsoleLogger('error');

  // Create project directory and write project definition first
  // This is needed because syncProject expects the definition to exist on disk
  const baseplateDir = path.join(config.directory, 'baseplate');
  await fs.mkdir(baseplateDir, { recursive: true });
  await fs.writeFile(
    path.join(baseplateDir, 'project-definition.json'),
    stringifyPrettyStable(definition),
  );

  // Create minimal plugin store (no plugins for initial project)
  const pluginStore: PluginStore = { availablePlugins: [] };

  // Create parser context
  const context: SchemaParserContext = {
    pluginStore,
    cliVersion: config.cliVersion,
    project: {
      id: generateProjectId(config.directory),
      name: config.name,
      directory: config.directory,
      isInternalExample: false,
    },
  };

  // Create sync metadata controller to set up .baseplate directory
  const syncMetadataController = new SyncMetadataController(
    config.directory,
    logger,
  );

  // Use syncProject to generate all files and set up metadata
  const result = await syncProject({
    directory: config.directory,
    logger,
    context,
    userConfig: {},
    syncMetadataController,
    overwrite: true,
  });

  if (result.status === 'error') {
    throw new Error('Failed to generate project files');
  }
}
