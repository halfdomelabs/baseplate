import type { Logger } from '@src/utils/evented-logger.js';

import type { GeneratorOutput } from './generator-task-output.js';
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
   * The merge driver to use following the custom merge driver command instead of the
   * default 3-way merge driver.
   *
   * See https://git-scm.com/docs/gitattributes#_defining_a_custom_merge_driver
   */
  mergeDriver?: { name: string; driver: string };
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
   * Relative paths of files that had conflicts
   */
  relativePathsWithConflicts: string[];
  /**
   * Commands that failed to run
   */
  failedCommands: string[];
  /**
   * Relative paths that were removed in new generation but were modified so
   * could not be automatically deleted.
   */
  relativePathsPendingDelete: string[];
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

    const relativePathsWithConflicts: string[] = files
      .filter((result) => result.hasConflict)
      .map((result) => result.relativePath);

    // don't run commands if there are conflicts
    if (relativePathsWithConflicts.length > 0) {
      return {
        relativePathsWithConflicts,
        failedCommands: orderedCommands.map((c) => c.command),
        fileIdToRelativePathMap,
        relativePathsPendingDelete,
      };
    }

    const { failedCommands } = await runPostWriteCommands(
      orderedCommands,
      outputDirectory,
      logger,
    );

    return {
      relativePathsWithConflicts: [],
      failedCommands,
      fileIdToRelativePathMap,
      relativePathsPendingDelete,
    };
  } catch (error) {
    if (error instanceof FormatterError) {
      logger.error(`Error formatting file: ${error.message}`);
      logger.info(`File Dump:\n${error.fileContents}`);
    }
    throw error;
  }
}
