import fs from 'node:fs/promises';
import path from 'node:path';

export async function readDirectoryRecursive(
  directoryPath: string,
): Promise<string[]> {
  const files: string[] = await fs.readdir(directoryPath);

  // Array to store all the file paths
  let filePaths: string[] = [];

  for (const file of files) {
    const filePath = `${directoryPath}/${file}`;
    const fileStat = await fs.stat(filePath);

    if (fileStat.isDirectory()) {
      // If the file is a directory, recursively call the function
      const subDirectoryFiles = await readDirectoryRecursive(filePath);
      filePaths = [...filePaths, ...subDirectoryFiles];
    } else {
      // If the file is a regular file, add its path to the array
      filePaths.push(filePath);
    }
  }

  return filePaths;
}

export async function listDirectories(
  directoryPath: string,
): Promise<string[]> {
  const entries = await fs.readdir(directoryPath, {
    withFileTypes: true,
  });

  const directories = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(directoryPath, entry.name));

  const subDirectories = await Promise.all(
    directories.map((directory) => listDirectories(directory)),
  );

  return [...directories, ...subDirectories.flat()];
}

export async function pathExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function ensureDir(directoryPath: string): Promise<void> {
  try {
    await fs.access(directoryPath);
  } catch (error) {
    if (
      error instanceof Error &&
      (error as unknown as { code: string }).code === 'ENOENT'
    ) {
      await fs.mkdir(directoryPath, { recursive: true });
    } else {
      throw error;
    }
  }
}

export async function readJSON<T>(filePath: string): Promise<T> {
  const fileData: string = await fs.readFile(filePath, 'utf8');
  const jsonData = JSON.parse(fileData) as T;
  return jsonData;
}
