import {
  AppEntry,
  prettyStableStringify,
  ProjectDefinition,
  runSchemaMigrations,
  SchemaParserContext,
} from '@halfdomelabs/project-builder-lib';
import { Logger } from '@halfdomelabs/sync';
import fs from 'fs-extra';
import path from 'path';

import {
  generateCleanAppForDirectory,
  generateForDirectory,
  GeneratorEngineSetupConfig,
} from '../sync/index.js';
import { writeApplicationFiles } from '../writer/index.js';
import { compileApplications } from '@src/compiler/index.js';

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
  regen?: boolean;
  logger: Logger;
  context: SchemaParserContext;
}

export async function buildProjectForDirectory({
  directory,
  generatorSetupConfig,
  regen,
  logger,
  context,
}: BuildProjectForDirectoryOptions): Promise<void> {
  const apps = await compileApplicationsFromDirectory({
    directory,
    context,
  });

  const modifiedApps = await writeApplicationFiles(directory, apps, logger);

  const shouldRegen = regen ?? process.env.FORCE_REGEN === 'true';

  const appsToRegenerate = shouldRegen ? apps : modifiedApps;

  // eslint-disable-next-line no-restricted-syntax
  for (const app of appsToRegenerate) {
    // eslint-disable-next-line no-await-in-loop
    await generateForDirectory({
      baseDirectory: directory,
      appEntry: app,
      logger,
      generatorSetupConfig,
    });
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

  // eslint-disable-next-line no-restricted-syntax
  for (const app of apps) {
    // eslint-disable-next-line no-await-in-loop
    await generateCleanAppForDirectory({
      baseDirectory: directory,
      appEntry: app,
      logger,
      generatorSetupConfig,
    });
  }

  logger.info(`Project written to ${directory}!`);
}
