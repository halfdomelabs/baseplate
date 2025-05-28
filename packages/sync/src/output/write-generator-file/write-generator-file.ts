import fs from 'node:fs/promises';
import path from 'node:path';

import { ensureDir, pathExists } from '#src/utils/fs.js';

import type { GeneratorFileOperationResult } from '../prepare-generator-files/types.js';

interface WriteGeneratorFileInput {
  /**
   * File operation result from prepare generator files
   */
  fileOperation: GeneratorFileOperationResult;
  /**
   * Directory to write the merged contents to
   */
  outputDirectory: string;
  /**
   * Optional directory to write the generated contents to
   */
  generatedContentsDirectory?: string;
}

/**
 * Rename a file if needed, throwing if the target path exists
 */
async function renameFileIfNeeded(
  previousPath: string,
  newPath: string,
  outputDirectory: string,
): Promise<void> {
  if (previousPath === newPath) return;

  const fullPreviousPath = path.join(outputDirectory, previousPath);
  const fullNewPath = path.join(outputDirectory, newPath);

  if (await pathExists(fullNewPath)) {
    throw new Error(
      `Cannot rename ${fullPreviousPath} to ${fullNewPath} as target path already exists`,
    );
  }

  await ensureDir(path.dirname(fullNewPath));
  await fs.rename(fullPreviousPath, fullNewPath);
}

/**
 * Write file contents to a specified path
 */
async function writeFileContents(
  contents: Buffer,
  filePath: string,
): Promise<void> {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, contents);
}

/**
 * Write merged contents if they exist
 */
async function writeMergedContents(
  mergedContents: Buffer | undefined,
  relativePath: string,
  outputDirectory: string,
): Promise<void> {
  if (!mergedContents) return;

  const fullPath = path.join(outputDirectory, relativePath);
  await writeFileContents(mergedContents, fullPath);
}

/**
 * Write generated contents to specified directory
 */
async function writeGeneratedContents(
  generatedContents: Buffer,
  relativePath: string,
  directory: string,
): Promise<void> {
  const fullPath = path.join(directory, relativePath);
  await writeFileContents(generatedContents, fullPath);
}

/**
 * Write conflict contents if needed
 */
async function writeConflictContents(
  generatedContents: Buffer,
  conflictPath: string | undefined,
  outputDirectory: string,
): Promise<void> {
  if (!conflictPath) return;

  const fullPath = path.join(outputDirectory, conflictPath);
  await writeFileContents(generatedContents, fullPath);
}

/**
 * Write a generator file based on the prepare generator file result
 */
export async function writeGeneratorFile({
  fileOperation,
  outputDirectory,
  generatedContentsDirectory,
}: WriteGeneratorFileInput): Promise<void> {
  const {
    relativePath,
    previousRelativePath,
    mergedContents,
    generatedContents,
    generatedConflictRelativePath,
  } = fileOperation;

  // Handle file renames first
  if (previousRelativePath) {
    await renameFileIfNeeded(
      previousRelativePath,
      relativePath,
      outputDirectory,
    );
  }

  // Write merged contents if they exist
  await writeMergedContents(mergedContents, relativePath, outputDirectory);

  // Write generated contents to separate directory if specified
  if (generatedContentsDirectory) {
    await writeGeneratedContents(
      generatedContents,
      relativePath,
      generatedContentsDirectory,
    );
  }

  // Write conflict contents if needed
  await writeConflictContents(
    generatedContents,
    generatedConflictRelativePath,
    outputDirectory,
  );
}
