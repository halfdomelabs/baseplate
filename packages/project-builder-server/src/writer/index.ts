import type { AppEntry, FileEntry } from '@halfdomelabs/project-builder-lib';
import type { Logger } from '@halfdomelabs/sync';

import fs from 'fs-extra';
import { globby } from 'globby';
import stringify from 'json-stringify-pretty-compact';
import path from 'node:path';

import { notEmpty } from '../utils/array.js';

/**
 * Writes a file entry and returns if the file contents have changed
 */
async function writeFileEntry(
  rootDirectory: string,
  file: FileEntry,
): Promise<boolean> {
  const jsonContent = stringify(file.jsonContent);
  const filePath = path.join(rootDirectory, file.path);

  const fileExists = await fs.pathExists(filePath);
  if (fileExists) {
    const existingContents = await fs.readFile(filePath, 'utf8');
    if (existingContents === jsonContent) {
      return false;
    }
  }
  await fs.ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, `${jsonContent}\n`);
  return true;
}

/**
 * Writes out files for application and returns if any files have changed
 */
async function writeAppFiles(
  baseDirectory: string,
  app: AppEntry,
  logger: Logger,
): Promise<boolean> {
  try {
    const appDirectory = path.join(baseDirectory, app.rootDirectory);
    const anyModified = await Promise.all(
      app.files.map((file) => writeFileEntry(appDirectory, file)),
    );

    // delete all files that aren't present
    const allJsonFiles = await globby(['baseplate/**/*.json'], {
      cwd: appDirectory,
    });
    const missingJsonFiles = allJsonFiles.filter(
      (file) => !app.files.some((f) => f.path === file),
    );

    await Promise.all(
      missingJsonFiles.map((f) => fs.unlink(path.join(appDirectory, f))),
    );

    return anyModified.some(Boolean);
  } catch (error) {
    logger.error(
      `Error writing out app ${app.name}: ${(error as Error).message}`,
    );
    throw error;
  }
}

/**
 * Writes out files of application and returns project entries that were modified
 */
export async function writeApplicationFiles(
  baseDirectory: string,
  apps: AppEntry[],
  logger: Logger,
): Promise<AppEntry[]> {
  // make sure we don't write out files for duplicate directories
  const directories = apps.map((app) =>
    path.resolve(path.join(baseDirectory, app.rootDirectory)),
  );

  const uniqueDirectories = [...new Set(directories)];
  if (directories.length !== uniqueDirectories.length) {
    throw new Error(
      'Duplicate directories found in app entries, cannot write files',
    );
  }

  const modifiedApps = await Promise.all(
    apps.map(async (app) => {
      const wasModified = await writeAppFiles(baseDirectory, app, logger);
      return wasModified ? app : null;
    }),
  );
  return modifiedApps.filter(notEmpty);
}
