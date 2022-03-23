import path from 'path';
import fs from 'fs-extra';
import { FileEntry, ProjectEntry } from '../types/files';
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
 * Writes out files for project and returns if any files have changed
 */
async function writeProjectFiles(
  baseDirectory: string,
  project: ProjectEntry
): Promise<boolean> {
  try {
    const projectDirectory = path.join(baseDirectory, project.rootDirectory);
    const anyModified = await Promise.all(
      project.files.map((file) => writeFileEntry(projectDirectory, file))
    );
    return anyModified.some((m) => m);
  } catch (err) {
    console.error(
      `Error writing out project ${project.name}: ${(err as Error).message}`
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
  projects: ProjectEntry[]
): Promise<ProjectEntry[]> {
  const modifiedProjects = await Promise.all(
    projects.map(async (project) => {
      const wasModified = await writeProjectFiles(baseDirectory, project);
      return wasModified ? project : null;
    })
  );
  return modifiedProjects.filter(notEmpty);
}
