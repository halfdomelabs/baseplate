import path from 'path';
import { FileEntry, AppEntry } from '@baseplate/project-builder-lib';
import fs from 'fs-extra';
import globby from 'globby';
import stringify from 'json-stringify-pretty-compact';
import { notEmpty } from '../utils/array';

/**
 * Writes a file entry and returns if the file contents have changed
 */
async function writeFileEntry(
  rootDirectory: string,
  file: FileEntry
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

    // delete all files that aren't present
    const allJsonFiles = await globby(['baseplate/**/*.json'], {
      cwd: `${appDirectory}`,
    });
    const missingJsonFiles = allJsonFiles.filter(
      (file) => !app.files.find((f) => f.path === file)
    );

    await Promise.all(
      missingJsonFiles.map((f) => fs.unlink(path.join(appDirectory, f)))
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

// async function areAppFilesModified(
//   baseDirectory: string,
//   app: AppEntry
// ): Promise<boolean> {
//   const appDirectory = path.join(baseDirectory, app.rootDirectory);
//   const modifiedFiles = await Promise.all(
//     app.files.map(async (file) => {
//       const filePath = path.join(appDirectory, file.path);
//       const fileExists = await fs.pathExists(filePath);
//       if (!fileExists) {
//         return true;
//       }
//       const existingContents = await fs.readFile(filePath, 'utf8');
//       const jsonContent = stringify(file.jsonContent);
//       return existingContents !== jsonContent;
//     })
//   );
//   return modifiedFiles.some((f) => f);
// }

// export async function getModifiedApps(
//   baseDirectory: string,
//   apps: AppEntry[]
// ): Promise<AppEntry[]> {
//   const modifiedApps = await Promise.all(
//     apps.map(async (app) => {
//       const isModified = await areAppFilesModified(baseDirectory, app);
//       return isModified ? app : null;
//     })
//   );
//   return modifiedApps.filter(notEmpty);
// }
