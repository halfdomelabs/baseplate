import path from 'path';
import {
  compileApplication,
  AppConfig,
  appConfigSchema,
} from '@baseplate/project-builder-lib';
import fs from 'fs-extra';
import { generateForDirectory } from '../sync';
import { writeApplicationFiles } from '../writer';

async function loadAppJson(directory: string): Promise<AppConfig> {
  const appJsonPath = path.join(directory, 'baseplate/project.json');
  const fileExists = await fs.pathExists(appJsonPath);

  if (!fileExists) {
    throw new Error(`Could not find project.json file at ${appJsonPath}`);
  }

  const appJson: unknown = await fs.readJson(appJsonPath);
  return appConfigSchema.validate(appJson);
}

export async function buildAppForDirectory(
  directory: string,
  { regen }: { regen: boolean }
): Promise<void> {
  const resolvedDirectory = path.resolve(process.cwd(), directory);
  // load project.json file
  const appConfig = await loadAppJson(resolvedDirectory);

  const projects = compileApplication(appConfig);

  const modifiedProjects = await writeApplicationFiles(
    resolvedDirectory,
    projects
  );

  const projectsToRegenerate = regen ? projects : modifiedProjects;

  // eslint-disable-next-line no-restricted-syntax
  for (const project of projectsToRegenerate) {
    // eslint-disable-next-line no-await-in-loop
    await generateForDirectory(resolvedDirectory, project);
  }

  console.log(`Application written to ${resolvedDirectory}!`);
}
