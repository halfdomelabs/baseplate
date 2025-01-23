import pLimit from 'p-limit';

import { getGenerationConcurrencyLimit } from '@src/utils/concurrency.js';

import type { FileData } from '../generator-task-output.js';
import type {
  GeneratorFileOperationResult,
  GeneratorOutputFileWriterContext,
} from './types.js';

import { PrepareGeneratorFilesError } from './errors.js';
import { prepareGeneratorFile } from './prepare-generator-file.js';

/**
 * Prepare generator files input
 */
interface PrepareGeneratorFilesInput {
  /**
   * Map of files to prepare
   */
  files: Map<string, FileData>;
  /**
   * Context for the generator output file writer
   */
  context: GeneratorOutputFileWriterContext;
}

/**
 * Prepare generator files result
 */
interface PrepareGeneratorFilesResult {
  /**
   * List of files that were prepared
   */
  files: GeneratorFileOperationResult[];
  /**
   * Map of file ID to relative path
   */
  fileIdToRelativePathMap: Map<string, string>;
}

/**
 * Prepare generator files
 *
 * @param input - Prepare generator files input
 * @returns Prepare generator files result
 */
export async function prepareGeneratorFiles({
  files,
  context,
}: PrepareGeneratorFilesInput): Promise<PrepareGeneratorFilesResult> {
  const writeLimit = pLimit(getGenerationConcurrencyLimit());
  const fileResults = await Promise.all(
    Array.from(files.entries(), ([filename, file]) =>
      writeLimit(() =>
        prepareGeneratorFile({
          relativePath: filename,
          data: file,
          context,
        }).catch((err: unknown) => ({
          relativePath: filename,
          error: err,
        })),
      ),
    ),
  );

  const fileErrors: { relativePath: string; error: unknown }[] = [];
  const operationResults: GeneratorFileOperationResult[] = [];
  for (const result of fileResults) {
    if ('error' in result) {
      fileErrors.push(result);
    } else {
      operationResults.push(result);
    }
  }

  if (fileErrors.length > 0) {
    throw new PrepareGeneratorFilesError(fileErrors);
  }

  return {
    files: operationResults,
    fileIdToRelativePathMap: new Map(
      Array.from(files.entries(), ([relativePath, file]) => [
        file.id,
        relativePath,
      ]),
    ),
  };
}
