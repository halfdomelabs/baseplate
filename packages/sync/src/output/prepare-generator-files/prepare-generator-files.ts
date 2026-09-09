import pLimit from 'p-limit';

import { throwIfSyncCancelled } from '#src/errors.js';
import { getGenerationConcurrencyLimit } from '#src/utils/concurrency.js';

import type { FileData } from '../generator-task-output.js';
import type {
  GeneratorFileOperationResult,
  GeneratorOutputFileWriterContext,
} from './types.js';

import { PrepareGeneratorFilesError } from '../errors.js';
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
  /**
   * Signal that stops preparing further files when aborted
   */
  abortSignal?: AbortSignal;
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
  abortSignal,
}: PrepareGeneratorFilesInput): Promise<PrepareGeneratorFilesResult> {
  const writeLimit = pLimit(getGenerationConcurrencyLimit());
  const fileResults = await Promise.all(
    Array.from(files.entries(), ([filename, file]) =>
      writeLimit(() => {
        // Checked outside the catch below so a cancellation propagates as a
        // CancelledSyncError instead of being bundled into
        // PrepareGeneratorFilesError. Files still queued behind the concurrency
        // limit never start; the few already in flight run to completion, since
        // prettier's format() takes no signal.
        throwIfSyncCancelled(abortSignal);
        return prepareGeneratorFile({
          relativePath: filename,
          data: file,
          context,
        }).catch((err: unknown) => ({
          relativePath: filename,
          cause: err,
        }));
      }),
    ),
  );

  const fileErrors: { relativePath: string; cause: unknown }[] = [];
  const operationResults: GeneratorFileOperationResult[] = [];
  for (const result of fileResults) {
    if ('cause' in result) {
      fileErrors.push(result);
    } else {
      operationResults.push(result);
    }
  }

  if (fileErrors.length > 0) {
    throw new PrepareGeneratorFilesError(fileErrors);
  }

  const fileIdToRelativePathMap = new Map<string, string>();
  for (const [relativePath, file] of files.entries()) {
    if (fileIdToRelativePathMap.has(file.id)) {
      throw new PrepareGeneratorFilesError([
        {
          relativePath,
          cause: new Error(
            `File ID ${file.id} is already in use by file ${fileIdToRelativePathMap.get(
              file.id,
            )}`,
          ),
        },
      ]);
    }
    fileIdToRelativePathMap.set(file.id, relativePath);
  }

  return {
    files: operationResults,
    fileIdToRelativePathMap,
  };
}
