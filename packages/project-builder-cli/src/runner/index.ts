import path from 'path';
import {
  compileApplications,
  ProjectConfig,
  projectConfigSchema,
} from '@baseplate/project-builder-lib';
import fs from 'fs-extra';
import { generateCleanAppForDirectory, generateForDirectory } from '../sync';
import { writeApplicationFiles } from '../writer';

async function loadAppJson(directory: string): Promise<ProjectConfig> {
  const projectJsonPath = path.join(directory, 'baseplate/project.json');
  const fileExists = await fs.pathExists(projectJsonPath);

  if (!fileExists) {
    throw new Error(`Could not find project.json file at ${projectJsonPath}`);
  }

  const projectJson: unknown = await fs.readJson(projectJsonPath);
  return projectConfigSchema.validate(projectJson);
}

export async function buildProjectForDirectory(
  directory: string,
  { regen }: { regen: boolean }
): Promise<void> {
  const resolvedDirectory = path.resolve(process.cwd(), directory);
  // load project.json file
  const projectConfig = await loadAppJson(resolvedDirectory);

  const apps = compileApplications(projectConfig);

  const modifiedApps = await writeApplicationFiles(resolvedDirectory, apps);

  const appsToRegenerate = regen ? apps : modifiedApps;

  // eslint-disable-next-line no-restricted-syntax
  for (const app of appsToRegenerate) {
    // eslint-disable-next-line no-await-in-loop
    await generateForDirectory(resolvedDirectory, app);
  }

  console.log(`Project written to ${resolvedDirectory}!`);
}

export async function buildToCleanFolder(
  directory: string,
  { regen }: { regen: boolean }
): Promise<void> {
  const resolvedDirectory = path.resolve(process.cwd(), directory);
  // load project.json file
  const projectConfig = await loadAppJson(resolvedDirectory);

  const apps = compileApplications(projectConfig);

  const modifiedApps = await writeApplicationFiles(resolvedDirectory, apps);

  const appsToRegenerate = regen ? apps : modifiedApps;

  // eslint-disable-next-line no-restricted-syntax
  for (const app of appsToRegenerate) {
    // eslint-disable-next-line no-await-in-loop
    await generateCleanAppForDirectory(resolvedDirectory, app);
  }

  console.log(`Project written to ${resolvedDirectory}!`);
}
