import { handleFileNotFoundError } from '@baseplate-dev/utils/node';
import fs from 'node:fs/promises';
import path from 'node:path';

import { fileExists } from '#src/utils/fs.js';

/**
 * Interface for a codebase file reader
 */
export interface CodebaseFileReader {
  /**
   * Check if a file exists in the codebase
   *
   * @param relativePath - Relative path of the file to check
   * @returns True if the file exists, false otherwise
   */
  fileExists: (relativePath: string) => Promise<boolean>;
  /**
   * Read the contents of a file from the codebase
   *
   * @param relativePath - Relative path of the file to read
   * @returns Contents of the file or undefined if the file does not exist
   */
  readFile: (relativePath: string) => Promise<Buffer | undefined>;
}

/**
 * Create a codebase file reader from a directory
 *
 * @param directory - Directory to read files from
 * @returns Codebase file reader
 */
export function createCodebaseFileReaderFromDirectory(
  directory: string,
): CodebaseFileReader {
  return {
    fileExists: (relativePath: string) =>
      fileExists(path.join(directory, relativePath)),
    readFile: (relativePath: string) =>
      fs
        .readFile(path.join(directory, relativePath))
        .catch(handleFileNotFoundError),
  };
}

/**
 * Create a codebase file reader from a map of files
 *
 * @param files - Map of files to read
 * @returns Codebase file reader
 */
export function createCodebaseReaderFromMemory(
  files: Map<string, Buffer>,
): CodebaseFileReader {
  return {
    fileExists: (relativePath: string) =>
      Promise.resolve(files.has(relativePath)),
    readFile: (relativePath: string) =>
      Promise.resolve(files.get(relativePath)),
  };
}
