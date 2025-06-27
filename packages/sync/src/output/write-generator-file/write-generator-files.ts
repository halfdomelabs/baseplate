import pLimit from 'p-limit';

import { getGenerationConcurrencyLimit } from '#src/utils/concurrency.js';

import type { GeneratorFileOperationResult } from '../prepare-generator-files/types.js';

import { WriteGeneratorFilesError } from './errors.js';
import { writeGeneratorFile } from './write-generator-file.js';

interface WriteGeneratorFilesInput {
  /**
   * File operations to write
   */
  fileOperations: GeneratorFileOperationResult[];
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
 * Write multiple generator files in parallel
 */
export async function writeGeneratorFiles({
  fileOperations,
  outputDirectory,
  generatedContentsDirectory,
}: WriteGeneratorFilesInput): Promise<void> {
  const writeLimit = pLimit(getGenerationConcurrencyLimit());

  const writeErrors: { relativePath: string; error: unknown }[] = [];

  // Sort operations that require rename before other operations
  // to ensure that we write new files after renames occur
  const fileOperationsWithRenames = fileOperations.filter(
    (f) => f.previousRelativePath !== f.relativePath,
  );
  const fileOperationsWithoutRenames = fileOperations.filter(
    (f) => f.previousRelativePath === f.relativePath,
  );

  async function writeFileOperations(
    fileOperations: GeneratorFileOperationResult[],
  ): Promise<void> {
    await Promise.all(
      fileOperations.map((fileOperation) =>
        writeLimit(async () => {
          try {
            await writeGeneratorFile({
              fileOperation,
              outputDirectory,
              generatedContentsDirectory,
            });
          } catch (error: unknown) {
            writeErrors.push({
              relativePath: fileOperation.relativePath,
              error,
            });
          }
        }),
      ),
    );
  }

  await writeFileOperations(fileOperationsWithRenames);
  await writeFileOperations(fileOperationsWithoutRenames);

  if (writeErrors.length > 0) {
    throw new WriteGeneratorFilesError(writeErrors);
  }
}
