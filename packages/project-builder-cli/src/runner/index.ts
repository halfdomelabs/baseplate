import path from 'path';
import {
  compileApplications,
  ProjectConfig,
  projectConfigSchema,
} from '@halfdomelabs/project-builder-lib';
import { Logger } from '@halfdomelabs/sync';
import fs from 'fs-extra';
import { expandPathWithTilde } from '@src/utils/path.js';
import {
  generateCleanAppForDirectory,
  generateForDirectory,
} from '../sync/index.js';
import { writeApplicationFiles } from '../writer/index.js';

async function loadProjectJson(directory: string): Promise<ProjectConfig> {
  const projectJsonPath = expandPathWithTilde(
    path.join(directory, 'baseplate/project.json'),
  );
  const fileExists = await fs.pathExists(projectJsonPath);

  if (!fileExists) {
    throw new Error(`Could not find project.json file at ${projectJsonPath}`);
  }

  const projectJson: unknown = await fs.readJson(projectJsonPath);
  return projectConfigSchema.parse(projectJson);
}

export interface BuildProjectForDirectoryOptions {
  regen?: boolean;
}

export async function buildProjectForDirectory(
  directory: string,
  options: BuildProjectForDirectoryOptions,
  logger: Logger = console,
): Promise<void> {
  const resolvedDirectory = expandPathWithTilde(directory);
  // load project.json file
  const projectConfig = await loadProjectJson(resolvedDirectory);

  const apps = compileApplications(projectConfig);

  await writeApplicationFiles(resolvedDirectory, apps);

  // TODO: Remove regen disabled (for dev it's convenient)
  const appsToRegenerate = apps; // regen ? apps : modifiedApps;

  // eslint-disable-next-line no-restricted-syntax
  for (const app of appsToRegenerate) {
    // eslint-disable-next-line no-await-in-loop
    await generateForDirectory(resolvedDirectory, app, logger);
  }

  logger.log(`Project written to ${resolvedDirectory}!`);
}

export async function buildToCleanFolder(
  directory: string,
  options: unknown,
  logger: Logger = console,
): Promise<void> {
  const resolvedDirectory = path.resolve(process.cwd(), directory);
  // load project.json file
  const projectConfig = await loadProjectJson(resolvedDirectory);

  const apps = compileApplications(projectConfig);

  // eslint-disable-next-line no-restricted-syntax
  for (const app of apps) {
    // eslint-disable-next-line no-await-in-loop
    await generateCleanAppForDirectory(resolvedDirectory, app, logger);
  }

  logger.log(`Project written to ${resolvedDirectory}!`);
}
