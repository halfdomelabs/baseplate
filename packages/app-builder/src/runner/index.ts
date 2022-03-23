import path from 'path';
import fs from 'fs-extra';
import { compileApplication } from '../compiler';
import { AppConfig, appConfigSchema } from '../compiler/schema';
import { generateForDirectory } from '../sync';
import { writeApplicationFiles } from '../writer';

async function loadAppJson(directory: string): Promise<AppConfig> {
  const appJsonPath = path.join(directory, 'baseplate/app.json');
  const fileExists = await fs.pathExists(appJsonPath);

  if (!fileExists) {
    throw new Error(`Could not find app.json file at ${appJsonPath}`);
  }

  const appJson: unknown = await fs.readJson(appJsonPath);
  return appConfigSchema.validate(appJson);
}

export async function buildAppForDirectory(directory: string): Promise<void> {
  const resolvedDirectory = path.resolve(process.cwd(), directory);
  // load app.json file
  const appConfig = await loadAppJson(resolvedDirectory);

  const projects = compileApplication(appConfig);

  const modifiedProjects = await writeApplicationFiles(
    resolvedDirectory,
    projects
  );

  // eslint-disable-next-line no-restricted-syntax
  for (const project of modifiedProjects) {
    // eslint-disable-next-line no-await-in-loop
    await generateForDirectory(resolvedDirectory, project);
  }

  console.log(`Application written to ${resolvedDirectory}!`);
}
