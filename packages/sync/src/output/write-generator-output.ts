import path from 'node:path';

import type { Logger } from '@src/utils/evented-logger.js';

import { CancelledSyncError } from '@src/errors.js';

import type { GeneratorOutput } from './generator-task-output.js';
import type { FailedCommandInfo } from './post-write-commands/index.js';
import type {
  GeneratorOutputFileWriterContext,
  PreviousGeneratedPayload,
} from './prepare-generator-files/index.js';

import { cleanDeletedFiles } from './clean-deleted-files.js';
import { createCodebaseFileReaderFromDirectory } from './codebase-file-reader.js';
import {
  filterPostWriteCommands,
  runPostWriteCommands,
  sortPostWriteCommands,
} from './post-write-commands/index.js';
import {
  FormatterError,
  prepareGeneratorFiles,
} from './prepare-generator-files/index.js';
import { writeGeneratorFiles } from './write-generator-file/index.js';

/**
 * Options for writing the generator output
 */
export interface WriteGeneratorOutputOptions {
  /**
   * Payload for the previously generated codebase
   */
  previousGeneratedPayload?: PreviousGeneratedPayload;
  /**
   * Optional directory to write the generated contents to
   */
  generatedContentsDirectory?: string;
  /**
   * Commands to re-run if there are conflicts
   */
  rerunCommands?: string[];
  /**
   * Logger to use
   */
  logger?: Logger;
  /**
   * The merge driver to use following the custom merge driver command for custom Git merge drivers
   * instead of the default 3-way merge driver.
   *
   * See https://git-scm.com/docs/gitattributes#_defining_a_custom_merge_driver
   */
  mergeDriver?: { name: string; driver: string };
  /**
   * Abort signal to use for cancelling the write operation.
   */
  abortSignal?: AbortSignal;
}

/**
 * A file that had a conflict
 */
export interface FileWithConflict {
  /**
   * The relative path of the file
   */
  relativePath: string;
  /**
   * The relative path of the generated file that had the conflict
   */
  generatedConflictRelativePath?: string;
  /**
   * The type of conflict
   */
  conflictType:
    | 'merge-conflict' // The file was modified in both the working codebase and the generated codebase
    | 'working-deleted' // The file was deleted in the working codebase but baseplate is trying to add it back
    | 'generated-deleted'; // The file was deleted in the generated codebase but the current codebase has modified it
}

/**
 * Result of the write generator output operation
 */
export interface WriteGeneratorOutputResult {
  /**
   * Map of file IDs to relative paths
   */
  fileIdToRelativePathMap: Map<string, string>;
  /**
   * Files that had conflicts
   */
  filesWithConflicts: FileWithConflict[];
  /**
   * Commands that failed to run
   */
  failedCommands: FailedCommandInfo[];
}

/**
 * Write the generator output to the output directory
 *
 * @param output - The generator output to write
 * @param outputDirectory - The directory to write the output to
 * @param options - The write options
 * @returns The result of the write operation
 */
export async function writeGeneratorOutput(
  output: GeneratorOutput,
  outputDirectory: string,
  options?: WriteGeneratorOutputOptions,
): Promise<WriteGeneratorOutputResult> {
  const {
    previousGeneratedPayload,
    generatedContentsDirectory,
    rerunCommands = [],
    logger = console,
    abortSignal,
  } = options ?? {};
  // write files
  try {
    const workingCodebase =
      createCodebaseFileReaderFromDirectory(outputDirectory);
    const fileWriterContext: GeneratorOutputFileWriterContext = {
      formatters: output.globalFormatters,
      logger,
      outputDirectory,
      previousGeneratedPayload,
      previousWorkingCodebase: workingCodebase,
      mergeDriver: options?.mergeDriver,
    };

    const { files, fileIdToRelativePathMap } = await prepareGeneratorFiles({
      files: output.files,
      context: fileWriterContext,
    });

    if (abortSignal?.aborted) throw new CancelledSyncError();

    await writeGeneratorFiles({
      fileOperations: files,
      outputDirectory,
      generatedContentsDirectory,
    });

    // Clean up deleted files if we have previous generated contents
    const { relativePathsPendingDelete } = await cleanDeletedFiles({
      outputDirectory,
      previousGeneratedPayload,
      currentFileIdToRelativePathMap: fileIdToRelativePathMap,
    });

    if (abortSignal?.aborted) throw new CancelledSyncError();

    const modifiedRelativePaths = new Set(
      files
        .filter((result) => result.mergedContents)
        .map((result) => result.relativePath),
    );
    const commandsToRun = filterPostWriteCommands(output.postWriteCommands, {
      modifiedRelativePaths,
      rerunCommands,
    });
    const orderedCommands = sortPostWriteCommands(commandsToRun);

    const filesWithConflicts = [
      ...files
        .filter((result) => result.hasConflict)
        .map(
          (result): FileWithConflict => ({
            relativePath: result.relativePath,
            generatedConflictRelativePath: result.generatedConflictRelativePath,
            conflictType: 'merge-conflict',
          }),
        ),
      ...files
        .filter((result) => result.deletedInWorking)
        .map(
          (result): FileWithConflict => ({
            relativePath: result.relativePath,
            conflictType: 'working-deleted',
          }),
        ),
      ...relativePathsPendingDelete.map(
        (relativePath): FileWithConflict => ({
          relativePath,
          conflictType: 'generated-deleted',
        }),
      ),
    ];

    // don't run commands if there are conflicts
    if (filesWithConflicts.length > 0) {
      return {
        failedCommands: orderedCommands.map((c) => ({
          command: c.command,
          workingDir: path.join(
            outputDirectory,
            c.options?.workingDirectory ?? '',
          ),
        })),
        fileIdToRelativePathMap,
        filesWithConflicts,
      };
    }

    const { failedCommands } = await runPostWriteCommands(
      orderedCommands,
      outputDirectory,
      logger,
    );

    return {
      filesWithConflicts,
      failedCommands,
      fileIdToRelativePathMap,
    };
  } catch (error) {
    if (error instanceof FormatterError) {
      logger.error(`Error formatting file: ${error.message}`);
      logger.info(`File Dump:\n${error.fileContents}`);
    }
    throw error;
  }
}
