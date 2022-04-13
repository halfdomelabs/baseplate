import path from 'path';
import { FileEntry, AppEntry } from '@baseplate/project-builder-lib';
import fs from 'fs-extra';
import { notEmpty } from '../utils/array';

/**
 * Writes a file entry and returns if the file contents have changed
 */
async function writeFileEntry(
  rootDirectory: string,
  file: FileEntry
): Promise<boolean> {
  const jsonContent = JSON.stringify(file.jsonContent, null, 2);
  const filePath = path.join(rootDirectory, file.path);

  const fileExists = await fs.pathExists(filePath);
  if (fileExists) {
    const existingContents = await fs.readFile(filePath, 'utf8');
    if (existingContents === jsonContent) {
      return false;
    }
  }
  await fs.ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, jsonContent);
  return true;
}

/**
 * Writes out files for application and returns if any files have changed
 */
async function writeAppFiles(
  baseDirectory: string,
  app: AppEntry
): Promise<boolean> {
  try {
    const appDirectory = path.join(baseDirectory, app.rootDirectory);
    const anyModified = await Promise.all(
      app.files.map((file) => writeFileEntry(appDirectory, file))
    );
    return anyModified.some((m) => m);
  } catch (err) {
    console.error(
      `Error writing out app ${app.name}: ${(err as Error).message}`
    );
    console.error(err);
    return false;
  }
}

/**
 * Writes out files of application and returns project entries that were modified
 */
export async function writeApplicationFiles(
  baseDirectory: string,
  apps: AppEntry[]
): Promise<AppEntry[]> {
  const modifiedApps = await Promise.all(
    apps.map(async (app) => {
      const wasModified = await writeAppFiles(baseDirectory, app);
      return wasModified ? app : null;
    })
  );
  return modifiedApps.filter(notEmpty);
}
