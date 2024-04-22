import {
  ProjectDefinition,
  projectDefinitionSchema,
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
import { expandPathWithTilde } from '@src/utils/path.js';

async function loadProjectJson(directory: string): Promise<ProjectDefinition> {
  const projectJsonPath = expandPathWithTilde(
    path.join(directory, 'baseplate/project.json'),
  );
  const fileExists = await fs.pathExists(projectJsonPath);

  if (!fileExists) {
    throw new Error(`Could not find project.json file at ${projectJsonPath}`);
  }

  const projectJson: unknown = await fs.readJson(projectJsonPath);
  return projectDefinitionSchema.parse(projectJson);
}

export interface BuildProjectForDirectoryOptions {
  directory: string;
  generatorSetupConfig: GeneratorEngineSetupConfig;
  regen?: boolean;
  logger: Logger;
}

export async function buildProjectForDirectory({
  directory,
  generatorSetupConfig,
  regen,
  logger,
}: BuildProjectForDirectoryOptions): Promise<void> {
  const resolvedDirectory = expandPathWithTilde(directory);
  // load project.json file
  const projectDefinition = await loadProjectJson(resolvedDirectory);

  const apps = compileApplications(projectDefinition);

  const modifiedApps = await writeApplicationFiles(
    resolvedDirectory,
    apps,
    logger,
  );

  const shouldRegen = regen ?? process.env.FORCE_REGEN === 'true';

  const appsToRegenerate = shouldRegen ? apps : modifiedApps;

  // eslint-disable-next-line no-restricted-syntax
  for (const app of appsToRegenerate) {
    // eslint-disable-next-line no-await-in-loop
    await generateForDirectory({
      baseDirectory: resolvedDirectory,
      appEntry: app,
      logger,
      generatorSetupConfig,
    });
  }

  logger.info(`Project written to ${resolvedDirectory}!`);
}

interface BuildToCleanFolderOptions {
  directory: string;
  logger: Logger;
  generatorSetupConfig: GeneratorEngineSetupConfig;
}

export async function buildToCleanFolder({
  directory,
  logger,
  generatorSetupConfig,
}: BuildToCleanFolderOptions): Promise<void> {
  const resolvedDirectory = path.resolve(process.cwd(), directory);
  // load project.json file
  const projectDefinition = await loadProjectJson(resolvedDirectory);

  const apps = compileApplications(projectDefinition);

  // eslint-disable-next-line no-restricted-syntax
  for (const app of apps) {
    // eslint-disable-next-line no-await-in-loop
    await generateCleanAppForDirectory({
      baseDirectory: resolvedDirectory,
      appEntry: app,
      logger,
      generatorSetupConfig,
    });
  }

  logger.info(`Project written to ${resolvedDirectory}!`);
}
