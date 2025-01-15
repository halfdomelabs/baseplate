import type {
  AppEntry,
  ProjectDefinition,
  SchemaParserContext,
} from '@halfdomelabs/project-builder-lib';
import type { Logger } from '@halfdomelabs/sync';

import {
  prettyStableStringify,
  runSchemaMigrations,
} from '@halfdomelabs/project-builder-lib';
import fs from 'fs-extra';
import path from 'node:path';

import { compileApplications } from '@src/compiler/index.js';

import type { GeneratorEngineSetupConfig } from '../sync/index.js';

import {
  generateCleanAppForDirectory,
  generateForDirectory,
} from '../sync/index.js';

async function loadProjectJson(directory: string): Promise<unknown> {
  const projectJsonPath = path.join(
    directory,
    'baseplate/project-definition.json',
  );

  const fileExists = await fs.pathExists(projectJsonPath);

  if (!fileExists) {
    // previously, json file lived in project.json so search for that and migrate if needed
    const oldProjectJsonPath = path.join(directory, 'baseplate/project.json');
    if (await fs.pathExists(oldProjectJsonPath)) {
      await fs.move(oldProjectJsonPath, projectJsonPath);
    } else {
      throw new Error(`Could not find definition file at ${projectJsonPath}`);
    }
  }

  const projectJson: unknown = await fs.readJson(projectJsonPath);

  const { newConfig: migratedProjectJson, appliedMigrations } =
    runSchemaMigrations(projectJson as ProjectDefinition);
  if (appliedMigrations.length > 0) {
    await fs.writeFile(
      projectJsonPath,
      prettyStableStringify(migratedProjectJson),
    );
  }

  return migratedProjectJson;
}

async function compileApplicationsFromDirectory({
  directory,
  context,
}: {
  directory: string;
  context: SchemaParserContext;
}): Promise<AppEntry[]> {
  const projectJson = await loadProjectJson(directory);

  return compileApplications(projectJson, context);
}

export interface BuildProjectForDirectoryOptions {
  directory: string;
  generatorSetupConfig: GeneratorEngineSetupConfig;
  logger: Logger;
  context: SchemaParserContext;
}

export async function buildProjectForDirectory({
  directory,
  generatorSetupConfig,
  logger,
  context,
}: BuildProjectForDirectoryOptions): Promise<void> {
  const apps = await compileApplicationsFromDirectory({
    directory,
    context,
  });

  for (const app of apps) {
    await generateForDirectory({
      baseDirectory: directory,
      appEntry: app,
      logger,
      generatorSetupConfig,
    });
    throw new Error('Not implemented');
  }

  logger.info(`Project written to ${directory}!`);
}

interface BuildToCleanFolderOptions {
  directory: string;
  logger: Logger;
  generatorSetupConfig: GeneratorEngineSetupConfig;
  context: SchemaParserContext;
}

export async function buildToCleanFolder({
  directory,
  logger,
  generatorSetupConfig,
  context,
}: BuildToCleanFolderOptions): Promise<void> {
  const apps = await compileApplicationsFromDirectory({
    directory,
    context,
  });

  for (const app of apps) {
    await generateCleanAppForDirectory({
      baseDirectory: directory,
      appEntry: app,
      logger,
      generatorSetupConfig,
    });
  }

  logger.info(`Project written to ${directory}!`);
}
